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
    url_flashcard_generation_pipeline,
    url_essay_qa_generation_pipeline,
)

logger = logging.getLogger(__name__)

_QUIZ_MAX_INPUT_CHARS = 15000
_QUIZ_CHUNK_OVERLAP_CHARS = 1000
_QUIZ_PROMPT_TEMPLATE = Template(QUIZ_GENERATION_PROMPT, trim_blocks=True, lstrip_blocks=True)


def generate_quiz(
    url: str,
    num_questions: Optional[int] = None,
    difficulty: str = "medium",
    feedback: Optional[str] = None,
) -> Dict[str, Any]:
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
) -> Dict[str, Any]:
    """
    Generate a quiz from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        num_questions: Number of questions to generate. If None or <= 0, the model should pick an appropriate count automatically.
        difficulty: Difficulty level of the questions (easy, medium, hard)
        
    Returns:
        dict: A dictionary containing the quiz data
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
) -> Dict[str, Any]:
    """
    Generate flashcards from a URL.
    
    Args:
        url: The URL to generate flashcards from
        num_cards: Number of flashcards to generate (default: 10)
        
    Returns:
        dict: A dictionary containing the flashcard data
    """
    return url_flashcard_generation_pipeline.run(
        {
            "link_content_fetcher": {"urls": [url]},
            "prompt_builder": {
                "num_cards": num_cards,
                "feedback": feedback or "",
            },
        }
    )["flashcard_parser"]["flashcards"]


def generate_flashcards_from_pdf(
    pdf_path: str,
    num_cards: int = 10,
    feedback: str | None = None,
) -> Dict[str, Any]:
    """
    Generate flashcards from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        num_cards: Number of flashcards to generate (default: 10)
        feedback: Optional string that highlights learner weaknesses to prioritize
        
    Returns:
        dict: A dictionary containing the flashcard data
    """
    return pdf_flashcard_generation_pipeline.run(
        {
            "pdf_extractor": {"file_path": pdf_path},
            "prompt_builder": {
                "num_cards": num_cards,
                "feedback": feedback or "",
            },
        }
    )["flashcard_parser"]["flashcards"]


def generate_essay_qa(
    url: str,
    num_questions: int = 3,
    difficulty: str = "medium",
    feedback: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate essay-type questions with detailed answers from a URL.
    
    Args:
        url: The URL to generate questions from
        num_questions: Number of questions to generate (default: 3)
        difficulty: Difficulty level of the questions (easy, medium, hard)
        
    Returns:
        dict: A dictionary containing the Essay QA data
    """
    return url_essay_qa_generation_pipeline.run(
        {
            "link_content_fetcher": {"urls": [url]},
            "prompt_builder": {
                "num_questions": num_questions,
                "difficulty": difficulty,
                "feedback": feedback or "",
            },
        }
    )["essay_qa_parser"]["essay_qa"]


def generate_essay_qa_from_pdf(
    pdf_path: str,
    num_questions: int = 3,
    difficulty: str = "medium",
    feedback: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate essay-type questions with detailed answers from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        num_questions: Number of questions to generate (default: 3)
        difficulty: Difficulty level of the questions (easy, medium, hard)
        
    Returns:
        dict: A dictionary containing the Essay QA data
    """
    return pdf_essay_qa_generation_pipeline.run(
        {
            "pdf_extractor": {"file_path": pdf_path},
            "prompt_builder": {
                "num_questions": num_questions,
                "difficulty": difficulty,
                "feedback": feedback or "",
            },
        }
    )["essay_qa_parser"]["essay_qa"]


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
) -> Dict[str, Any]:
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
            index, quiz_segment = future.result()
            results[index] = quiz_segment

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

    return {
        "topic": combined_topic,
        "category": combined_category,
        "subcategory": combined_subcategory,
        "questions": combined_questions,
    }


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
) -> Tuple[int, Dict[str, Any]]:
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

    replies = generator.run(prompt=prompt)["replies"]
    quiz_segment = parser.run(replies=replies)["quiz"]

    return index, quiz_segment
