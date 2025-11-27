from __future__ import annotations

import logging
import math
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any, Dict, List, Optional, Tuple

from jinja2 import Template
from haystack.components.converters import HTMLToDocument
from haystack.components.fetchers import LinkContentFetcher

from backend.components.custom_components import PDFTextExtractor, QuizParser
from backend.generation.mcq_quiz_template import QUIZ_GENERATION_PROMPT
from backend.pipelines.content_pipelines import (
    LLM_CONFIG,
    create_generator,
    pdf_flashcard_generation_pipeline,
    pdf_essay_qa_generation_pipeline,
    pdf_mind_map_generation_pipeline,
    url_flashcard_generation_pipeline,
    url_essay_qa_generation_pipeline,
)

logger = logging.getLogger(__name__)


def _extract_token_usage_from_pipeline_result(result: Dict[str, Any], generator_component_name: str = "generator", pipeline_instance=None) -> Dict[str, int]:
    """
    Extract token usage from Haystack pipeline result.
    
    Haystack doesn't directly expose token usage, but we can try to access it from:
    1. The generator component's internal state
    2. Pipeline metadata if tracing is enabled
    3. The raw OpenAI response if accessible
    
    Args:
        result: The result dictionary from pipeline.run()
        generator_component_name: Name of the generator component in the pipeline
        
    Returns:
        Dictionary with input_tokens, output_tokens, and total_tokens (all 0 if not found)
    """
    try:
        # Method 1: Try to access the generator component from the pipeline
        # and get its last response
        generator_result = result.get(generator_component_name, {})
        
        # Method 2: Check if there's metadata in the result
        # Haystack may store this in different places depending on version
        metadata = None
        usage = {}
        
        # Try accessing metadata from generator result
        if hasattr(generator_result, "meta"):
            metadata = generator_result.meta
        elif isinstance(generator_result, dict):
            metadata = generator_result.get("meta", {})
            # Also check for direct usage in the result
            if not metadata and "usage" in generator_result:
                usage = generator_result.get("usage", {})
        
        # Method 3: Check if metadata is in the main result
        if not metadata and isinstance(result, dict):
            metadata = result.get("meta", {})
            if not usage and "usage" in result:
                usage = result.get("usage", {})
        
        # Extract usage from metadata
        if isinstance(metadata, dict):
            if not usage:
                usage = metadata.get("usage", {})
            # Also check for direct usage keys in metadata
            if not usage:
                usage = {k: v for k, v in metadata.items() if "token" in k.lower()}
        
        # Method 4: Try to access from generator's internal state via pipeline instance
        if not usage and pipeline_instance:
            try:
                generator_component = pipeline_instance.get_component(generator_component_name)
                if generator_component:
                    # Try to access internal OpenAI response
                    for attr in ["_last_response", "_response", "last_response"]:
                        if hasattr(generator_component, attr):
                            response = getattr(generator_component, attr)
                            if response:
                                if hasattr(response, "usage"):
                                    usage_obj = response.usage
                                    usage = {
                                        "prompt_tokens": getattr(usage_obj, "prompt_tokens", 0) or 0,
                                        "completion_tokens": getattr(usage_obj, "completion_tokens", 0) or 0,
                                        "total_tokens": getattr(usage_obj, "total_tokens", 0) or 0,
                                    }
                                    break
                                elif isinstance(response, dict) and "usage" in response:
                                    usage = response["usage"]
                                    break
            except Exception as e:
                logger.debug(f"Could not access generator from pipeline: {e}")
        
        # Method 5: Log the structure for debugging if still no usage found
        if not usage:
            logger.debug(f"Generator result type: {type(generator_result)}, keys: {list(generator_result.keys()) if isinstance(generator_result, dict) else 'N/A'}")
            logger.debug(f"Result keys: {list(result.keys()) if isinstance(result, dict) else 'N/A'}")
        
        # Try to extract token counts from various possible field names
        input_tokens = (
            usage.get("prompt_tokens") or 
            usage.get("input_tokens") or 
            usage.get("prompt_tokens_used") or
            0
        )
        output_tokens = (
            usage.get("completion_tokens") or 
            usage.get("output_tokens") or 
            usage.get("completion_tokens_used") or
            0
        )
        total_tokens = (
            usage.get("total_tokens") or 
            usage.get("total_tokens_used") or
            (input_tokens + output_tokens)
        )
        
        # Ensure we have integers
        input_tokens = int(input_tokens) if input_tokens else 0
        output_tokens = int(output_tokens) if output_tokens else 0
        total_tokens = int(total_tokens) if total_tokens else (input_tokens + output_tokens)
        
        if total_tokens == 0:
            # Log detailed structure for debugging
            logger.warning(f"Token usage extraction returned 0. Result structure: {type(result)}")
            if isinstance(result, dict):
                logger.warning(f"Result keys: {list(result.keys())}")
            logger.warning(f"Generator result type: {type(generator_result)}")
            if isinstance(generator_result, dict):
                logger.warning(f"Generator result keys: {list(generator_result.keys())}")
                # Log first few characters of values for debugging
                for key, value in list(generator_result.items())[:5]:
                    logger.warning(f"  {key}: {type(value)} - {str(value)[:100] if value else 'None'}")
        
        return {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
        }
    except Exception as e:
        logger.warning(f"Failed to extract token usage from pipeline result: {e}", exc_info=True)
        return {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}

_QUIZ_MAX_INPUT_CHARS = 15000
_QUIZ_CHUNK_OVERLAP_CHARS = 1000
_QUIZ_PROMPT_TEMPLATE = Template(QUIZ_GENERATION_PROMPT, trim_blocks=True, lstrip_blocks=True)


def generate_quiz(
    url: str,
    num_questions: Optional[int] = None,
    difficulty: str = "medium",
    feedback: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    extracted_text = _extract_text_from_url(url)
    return _generate_quiz_from_text(
        extracted_text,
        num_questions=num_questions,
        difficulty=difficulty,
        feedback=feedback,
    )


def generate_quiz_from_pdf(
    pdf_path: str,
    num_questions: Optional[int] = None,
    difficulty: str = "medium",
    feedback: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Generate a quiz from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        num_questions: Number of questions to generate. If None or <= 0, the model should pick an appropriate count automatically.
        difficulty: Difficulty level of the questions (easy, medium, hard)
        
    Returns:
        tuple: (quiz_data, token_usage) where token_usage contains input_tokens, output_tokens, total_tokens
    """
    extractor = PDFTextExtractor()
    extraction_result = extractor.run(file_path=pdf_path)
    extracted_text = extraction_result.get("text", "")

    if not extracted_text.strip():
        raise ValueError("No extractable text was found in the provided PDF.")

    return _generate_quiz_from_text(
        extracted_text,
        num_questions=num_questions,
        difficulty=difficulty,
        feedback=feedback,
    )


def generate_flashcards(
    url: str,
    num_cards: int = 10,
    feedback: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Generate flashcards from a URL.
    
    Args:
        url: The URL to generate flashcards from
        num_cards: Number of flashcards to generate (default: 10)
        
    Returns:
        tuple: (flashcard_data, token_usage) where token_usage contains input_tokens, output_tokens, total_tokens
    """
    result = url_flashcard_generation_pipeline.run(
        {
            "link_content_fetcher": {"urls": [url]},
            "prompt_builder": {
                "num_cards": num_cards,
                "feedback": feedback or "",
            },
        }
    )
    flashcards = result["flashcard_parser"]["flashcards"]
    token_usage = _extract_token_usage_from_pipeline_result(result, pipeline_instance=url_flashcard_generation_pipeline)
    return flashcards, token_usage


def generate_flashcards_from_pdf(
    pdf_path: str,
    num_cards: int = 10,
    feedback: str | None = None,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Generate flashcards from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        num_cards: Number of flashcards to generate (default: 10)
        feedback: Optional string that highlights learner weaknesses to prioritize
        
    Returns:
        tuple: (flashcard_data, token_usage) where token_usage contains input_tokens, output_tokens, total_tokens
    """
    result = pdf_flashcard_generation_pipeline.run(
        {
            "pdf_extractor": {"file_path": pdf_path},
            "prompt_builder": {
                "num_cards": num_cards,
                "feedback": feedback or "",
            },
        }
    )
    flashcards = result["flashcard_parser"]["flashcards"]
    token_usage = _extract_token_usage_from_pipeline_result(result, pipeline_instance=pdf_flashcard_generation_pipeline)
    return flashcards, token_usage


def generate_essay_qa(
    url: str,
    num_questions: int = 3,
    difficulty: str = "medium",
    feedback: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Generate essay-type questions with detailed answers from a URL.
    
    Args:
        url: The URL to generate questions from
        num_questions: Number of questions to generate (default: 3)
        difficulty: Difficulty level of the questions (easy, medium, hard)
        
    Returns:
        tuple: (essay_qa_data, token_usage) where token_usage contains input_tokens, output_tokens, total_tokens
    """
    result = url_essay_qa_generation_pipeline.run(
        {
            "link_content_fetcher": {"urls": [url]},
            "prompt_builder": {
                "num_questions": num_questions,
                "difficulty": difficulty,
                "feedback": feedback or "",
            },
        }
    )
    essay_qa = result["essay_qa_parser"]["essay_qa"]
    token_usage = _extract_token_usage_from_pipeline_result(result, pipeline_instance=url_essay_qa_generation_pipeline)
    return essay_qa, token_usage


def generate_essay_qa_from_pdf(
    pdf_path: str,
    num_questions: int = 3,
    difficulty: str = "medium",
    feedback: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Generate essay-type questions with detailed answers from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        num_questions: Number of questions to generate (default: 3)
        difficulty: Difficulty level of the questions (easy, medium, hard)
        
    Returns:
        tuple: (essay_qa_data, token_usage) where token_usage contains input_tokens, output_tokens, total_tokens
    """
    result = pdf_essay_qa_generation_pipeline.run(
        {
            "pdf_extractor": {"file_path": pdf_path},
            "prompt_builder": {
                "num_questions": num_questions,
                "difficulty": difficulty,
                "feedback": feedback or "",
            },
        }
    )
    essay_qa = result["essay_qa_parser"]["essay_qa"]
    token_usage = _extract_token_usage_from_pipeline_result(result, pipeline_instance=pdf_essay_qa_generation_pipeline)
    return essay_qa, token_usage


def generate_mind_map_from_pdf(
    pdf_path: str,
    focus: Optional[str] = None,
    feedback: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    """
    Generate a structured mind map JSON from a PDF file.

    Args:
        pdf_path: Path to the PDF file.
        focus: Optional hint about what to emphasize.
        feedback: Optional learner feedback context.
        
    Returns:
        tuple: (mind_map_data, token_usage) where token_usage contains input_tokens, output_tokens, total_tokens
    """
    logging.info("[MIND MAP GEN] Starting mind map generation from PDF: %s", pdf_path)
    if focus:
        logging.info("[MIND MAP GEN] Focus provided: %s", focus[:100] if len(focus) > 100 else focus)
    if feedback:
        logging.debug("[MIND MAP GEN] Feedback context provided (length: %d chars)", len(feedback) if feedback else 0)

    payload = {
        "pdf_extractor": {"file_path": pdf_path},
        # The template currently only uses "focus" in addition to "documents".
        "prompt_builder": {
            "focus": focus or "",
        },
    }
    
    logging.debug("[MIND MAP GEN] Running pipeline with payload keys: %s", list(payload.keys()))
    try:
        result = pdf_mind_map_generation_pipeline.run(payload)
        mind_map = result["mind_map_parser"]["mind_map"]
        token_usage = _extract_token_usage_from_pipeline_result(result, pipeline_instance=pdf_mind_map_generation_pipeline)
        
        node_count = len(mind_map.get("nodes", []))
        edge_count = len(mind_map.get("edges", []))
        logging.info(
            "[MIND MAP GEN] Successfully generated mind map: topic='%s', nodes=%d, edges=%d, tokens=%d",
            mind_map.get("topic", "N/A"),
            node_count,
            edge_count,
            token_usage.get("total_tokens", 0),
        )
        
        return mind_map, token_usage
    except Exception as e:
        logging.error("[MIND MAP GEN] Failed to generate mind map from PDF %s: %s", pdf_path, str(e))
        raise


def _extract_text_from_url(url: str) -> str:
    fetcher = LinkContentFetcher()
    fetch_result = fetcher.run(urls=[url])
    documents = fetch_result.get("documents", [])
    if not documents:
        raise ValueError(f"No content could be fetched from URL: {url}")

    converter = HTMLToDocument()
    converted = converter.run(sources=documents)
    html_documents = converted.get("documents", [])

    aggregated_text_parts: List[str] = []
    for doc in html_documents:
        content = getattr(doc, "content", None)
        if content:
            aggregated_text_parts.append(content)

    aggregated_text = "\n\n".join(aggregated_text_parts).strip()
    if not aggregated_text:
        raise ValueError(f"Unable to extract meaningful text content from URL: {url}")

    return aggregated_text


def _generate_quiz_from_text(
    source_text: str,
    num_questions: Optional[int],
    difficulty: str,
    feedback: Optional[str] = None,
) -> Tuple[Dict[str, Any], Dict[str, int]]:
    chunks = _chunk_text(source_text, _QUIZ_MAX_INPUT_CHARS, _QUIZ_CHUNK_OVERLAP_CHARS)
    if not chunks:
        raise ValueError("Provided content did not contain any usable text segments.")

    auto_question_mode = num_questions is None or num_questions <= 0
    question_targets = (
        _distribute_question_targets(len(chunks), num_questions)
        if not auto_question_mode
        else [None] * len(chunks)
    )

    results: Dict[int, Dict[str, Any]] = {}
    token_usages: List[Dict[str, int]] = []
    max_workers = min(len(chunks), 3)

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(
                _generate_quiz_for_chunk,
                index,
                chunk_text,
                target if (target and not auto_question_mode) else 0,
                auto_question_mode,
                difficulty,
                feedback,
            )
            for index, (chunk_text, target) in enumerate(zip(chunks, question_targets))
        ]

        for future in as_completed(futures):
            index, quiz_segment, token_usage = future.result()
            results[index] = quiz_segment
            token_usages.append(token_usage)

    if not results:
        raise ValueError("Quiz generation returned no questions for the provided content.")

    ordered_segments = [results[idx] for idx in sorted(results.keys())]

    combined_topic = next((seg.get("topic") for seg in ordered_segments if seg.get("topic")), "Generated Quiz")
    combined_category = next((seg.get("category") for seg in ordered_segments if seg.get("category")), "General Knowledge")
    combined_subcategory = next((seg.get("subcategory") for seg in ordered_segments if seg.get("subcategory")), "General")

    combined_questions: List[Dict[str, Any]] = []
    for segment in ordered_segments:
        questions = segment.get("questions", [])
        if isinstance(questions, list):
            combined_questions.extend(questions)

    if not combined_questions:
        raise ValueError("Quiz generation returned no questions for the provided content.")

    if not auto_question_mode and num_questions:
        combined_questions = combined_questions[:num_questions]

    # Aggregate token usage from all chunks
    total_input_tokens = sum(usage.get("input_tokens", 0) for usage in token_usages)
    total_output_tokens = sum(usage.get("output_tokens", 0) for usage in token_usages)
    total_tokens = sum(usage.get("total_tokens", 0) for usage in token_usages)

    quiz_data = {
        "topic": combined_topic,
        "category": combined_category,
        "subcategory": combined_subcategory,
        "questions": combined_questions,
    }
    
    token_usage = {
        "input_tokens": total_input_tokens,
        "output_tokens": total_output_tokens,
        "total_tokens": total_tokens,
    }

    return quiz_data, token_usage


def _chunk_text(text: str, max_chars: int, overlap: int) -> List[str]:
    normalized_text = text.strip()
    if len(normalized_text) <= max_chars:
        return [normalized_text]

    chunks: List[str] = []
    start = 0
    text_length = len(normalized_text)

    while start < text_length:
        end = min(start + max_chars, text_length)
        if end < text_length:
            split_index = max(
                normalized_text.rfind("\n\n", start, end),
                normalized_text.rfind(". ", start, end),
            )
            if split_index == -1 or split_index <= start + int(max_chars * 0.4):
                split_index = end
            else:
                split_index += 1  # include the sentence-ending character
            end = split_index

        chunk = normalized_text[start:end].strip()
        if chunk:
            chunks.append(chunk)

        if end >= text_length:
            break

        next_start = max(end - overlap, start + 1)
        start = next_start

    return chunks


def _distribute_question_targets(chunk_count: int, total_questions: Optional[int]) -> List[int]:
    if not total_questions or total_questions <= 0 or chunk_count <= 0:
        return [0] * max(chunk_count, 1)

    remaining = total_questions
    remaining_chunks = chunk_count
    targets: List[int] = []

    for _ in range(chunk_count):
        chunk_target = max(1, math.ceil(remaining / remaining_chunks))
        targets.append(chunk_target)
        remaining -= chunk_target
        remaining_chunks -= 1
        if remaining <= 0:
            break

    # If we exited early because remaining <= 0, pad the rest with zeros
    while len(targets) < chunk_count:
        targets.append(0)

    return targets


def _generate_quiz_for_chunk(
    index: int,
    chunk_text: str,
    chunk_target: int,
    auto_question_mode: bool,
    difficulty: str,
    feedback: Optional[str],
) -> Tuple[int, Dict[str, Any], Dict[str, int]]:
    logger.debug("Submitting quiz generation for chunk %s (length=%s characters)", index + 1, len(chunk_text))

    prompt_inputs = {
        "documents": chunk_text,
        "num_questions": chunk_target if (chunk_target and not auto_question_mode) else 0,
        "auto_question_mode": auto_question_mode,
        "difficulty": difficulty,
        "feedback": feedback or "",
    }
    prompt = _QUIZ_PROMPT_TEMPLATE.render(**prompt_inputs)

    generator = create_generator(temperature=LLM_CONFIG["quiz_temperature"])
    parser = QuizParser()

    generator_result = generator.run(prompt=prompt)
    replies = generator_result["replies"]
    quiz_segment = parser.run(replies=replies)["quiz"]
    
    # Extract token usage - try multiple methods
    token_usage = _extract_token_usage_from_generator_result(generator_result)
    
    # If not found in result, try to access generator's internal state
    if token_usage["total_tokens"] == 0:
        token_usage = _extract_token_usage_from_generator_instance(generator)

    return index, quiz_segment, token_usage


def _extract_token_usage_from_generator_instance(generator) -> Dict[str, int]:
    """
    Try to extract token usage from the generator instance's internal state.
    Haystack's OpenAIGenerator may store the last OpenAI response internally.
    
    Args:
        generator: The OpenAIGenerator instance
        
    Returns:
        Dictionary with input_tokens, output_tokens, and total_tokens (all 0 if not found)
    """
    try:
        # Try to access internal attributes where Haystack might store the response
        # Common attribute names: _last_response, _response, last_response, response
        # Also try accessing the OpenAI client directly
        for attr_name in ["_last_response", "_response", "last_response", "response", "_last_raw_response"]:
            if hasattr(generator, attr_name):
                response = getattr(generator, attr_name)
                if response:
                    # Check if it's an OpenAI response object
                    if hasattr(response, "usage"):
                        usage = response.usage
                        if usage:
                            return {
                                "input_tokens": getattr(usage, "prompt_tokens", 0) or 0,
                                "output_tokens": getattr(usage, "completion_tokens", 0) or 0,
                                "total_tokens": getattr(usage, "total_tokens", 0) or 0,
                            }
                    # Also try if response is a dict
                    if isinstance(response, dict):
                        if "usage" in response:
                            usage = response["usage"]
                            return {
                                "input_tokens": usage.get("prompt_tokens", 0) or usage.get("input_tokens", 0) or 0,
                                "output_tokens": usage.get("completion_tokens", 0) or usage.get("output_tokens", 0) or 0,
                                "total_tokens": usage.get("total_tokens", 0) or 0,
                            }
        
        # Try accessing the OpenAI client's last response
        for client_attr in ["_client", "_api_client", "client"]:
            if hasattr(generator, client_attr):
                client = getattr(generator, client_attr)
                if client and hasattr(client, "chat"):
                    # Try to get last response from chat completions
                    if hasattr(client.chat.completions, "_last_response"):
                        response = client.chat.completions._last_response
                        if response and hasattr(response, "usage"):
                            usage = response.usage
                            return {
                                "input_tokens": getattr(usage, "prompt_tokens", 0) or 0,
                                "output_tokens": getattr(usage, "completion_tokens", 0) or 0,
                                "total_tokens": getattr(usage, "total_tokens", 0) or 0,
                            }
    except Exception as e:
        logger.debug(f"Failed to extract token usage from generator instance: {e}")
    
    return {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}


def _extract_token_usage_from_generator_result(generator_result: Dict[str, Any]) -> Dict[str, int]:
    """
    Extract token usage from Haystack generator result.
    
    Since Haystack doesn't expose token usage directly, we need to access it from:
    1. The generator's internal _last_response attribute (if accessible)
    2. Metadata in the result
    3. The generator instance's internal state
    
    Args:
        generator_result: The result dictionary from generator.run()
        
    Returns:
        Dictionary with input_tokens, output_tokens, and total_tokens (all 0 if not found)
    """
    try:
        # Method 1: Check for metadata in the generator result
        metadata = generator_result.get("meta", {})
        if not metadata and hasattr(generator_result, "meta"):
            metadata = generator_result.meta
        
        # Extract usage from metadata
        usage = {}
        if isinstance(metadata, dict):
            usage = metadata.get("usage", {})
            # Also check for direct usage keys in metadata
            if not usage:
                usage = {k: v for k, v in metadata.items() if "token" in k.lower()}
        
        # Method 2: Check if usage is directly in the result
        if not usage and isinstance(generator_result, dict):
            if "usage" in generator_result:
                usage = generator_result.get("usage", {})
        
        # Try to extract token counts from various possible field names
        input_tokens = (
            usage.get("prompt_tokens") or 
            usage.get("input_tokens") or 
            usage.get("prompt_tokens_used") or
            0
        )
        output_tokens = (
            usage.get("completion_tokens") or 
            usage.get("output_tokens") or 
            usage.get("completion_tokens_used") or
            0
        )
        total_tokens = (
            usage.get("total_tokens") or 
            usage.get("total_tokens_used") or
            (input_tokens + output_tokens)
        )
        
        # Ensure we have integers
        input_tokens = int(input_tokens) if input_tokens else 0
        output_tokens = int(output_tokens) if output_tokens else 0
        total_tokens = int(total_tokens) if total_tokens else (input_tokens + output_tokens)
        
        if total_tokens == 0:
            logger.debug(f"Token usage extraction returned 0. Generator result keys: {list(generator_result.keys()) if isinstance(generator_result, dict) else 'N/A'}")
        
        return {
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "total_tokens": total_tokens,
        }
    except Exception as e:
        logger.warning(f"Failed to extract token usage from generator result: {e}", exc_info=True)
        return {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}
