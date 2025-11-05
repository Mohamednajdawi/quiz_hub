from typing import Optional, Dict, Any
import os
from haystack import Pipeline
from haystack.components.builders import PromptBuilder
from haystack.components.converters import HTMLToDocument
from haystack.components.fetchers import LinkContentFetcher
from haystack.components.generators import OpenAIGenerator
from haystack.utils import Secret

from backend.components.custom_components import PDFTextExtractor, QuizParser, FlashcardParser, EssayQAParser
from backend.generation.mcq_quiz_template import QUIZ_GENERATION_PROMPT
from backend.generation.flashcard_template import FLASHCARD_GENERATION_PROMPT
from backend.generation.essay_qa_template import Essay_QA_PROMPT

# Validate that required environment variables exist
if not os.environ.get("GROQ_API_KEY"):
    raise EnvironmentError("GROQ_API_KEY environment variable must be set")

# Configuration for LLM usage
LLM_CONFIG = {
    "api_base_url": "https://api.groq.com/openai/v1",
    "model": "openai/gpt-oss-120b",
    "default_max_tokens": 2000,
    "quiz_temperature": 0.8,
    "flashcard_temperature": 0.7,
    "essay_qa_temperature": 0.7,
}

def create_generator(temperature: float = 0.8) -> OpenAIGenerator:
    """
    Create a standard OpenAI generator with the given temperature.
    
    Args:
        temperature: Controls randomness in generation (0.0 to 1.0). 
                     Higher values produce more diverse outputs.
                     
    Returns:
        OpenAIGenerator: Configured generator component
    
    Raises:
        ValueError: If temperature is not in valid range
    """
    if not 0 <= temperature <= 1:
        raise ValueError(f"Temperature must be between 0 and 1, got {temperature}")
        
    return OpenAIGenerator(
        api_key=Secret.from_env_var("GROQ_API_KEY"),
        api_base_url=LLM_CONFIG["api_base_url"],
        model=LLM_CONFIG["model"],
        generation_kwargs={
            "max_tokens": LLM_CONFIG["default_max_tokens"], 
            "temperature": temperature, 
            "top_p": 1
        },
    )

# ==================== QUIZ PIPELINES ====================

def create_pdf_quiz_pipeline() -> Pipeline:
    """
    Creates a pipeline that generates multiple-choice quiz questions from PDF content.
    
    Returns:
        Pipeline: A configured pipeline for PDF-based quiz generation
    """
    pipeline = Pipeline()
    pipeline.add_component("pdf_extractor", PDFTextExtractor())
    pipeline.add_component(
        "prompt_builder", PromptBuilder(template=QUIZ_GENERATION_PROMPT)
    )
    pipeline.add_component("generator", create_generator(temperature=LLM_CONFIG["quiz_temperature"]))
    pipeline.add_component("quiz_parser", QuizParser())

    # Specify the exact connections between components
    pipeline.connect("pdf_extractor.text", "prompt_builder.documents")
    pipeline.connect("prompt_builder", "generator")
    pipeline.connect("generator", "quiz_parser")
    
    return pipeline

def create_url_quiz_pipeline() -> Pipeline:
    """
    Creates a pipeline that generates multiple-choice quiz questions from web page content.
    
    Returns:
        Pipeline: A configured pipeline for URL-based quiz generation
    """
    pipeline = Pipeline()
    pipeline.add_component("link_content_fetcher", LinkContentFetcher())
    pipeline.add_component("html_converter", HTMLToDocument())
    pipeline.add_component(
        "prompt_builder", PromptBuilder(template=QUIZ_GENERATION_PROMPT)
    )
    pipeline.add_component("generator", create_generator(temperature=LLM_CONFIG["quiz_temperature"]))
    pipeline.add_component("quiz_parser", QuizParser())

    # Specify the exact connections between components
    pipeline.connect("link_content_fetcher", "html_converter")
    pipeline.connect("html_converter", "prompt_builder")
    pipeline.connect("prompt_builder", "generator")
    pipeline.connect("generator", "quiz_parser")
    
    return pipeline

# Create instances of the quiz pipelines
pdf_quiz_generation_pipeline = create_pdf_quiz_pipeline()
url_quiz_generation_pipeline = create_url_quiz_pipeline()

# ==================== FLASHCARD PIPELINES ====================

def create_pdf_flashcard_pipeline() -> Pipeline:
    """
    Creates a pipeline that generates flashcards from PDF content.
    
    Returns:
        Pipeline: A configured pipeline for PDF-based flashcard generation
    """
    pipeline = Pipeline()
    pipeline.add_component("pdf_extractor", PDFTextExtractor())
    pipeline.add_component(
        "prompt_builder", PromptBuilder(template=FLASHCARD_GENERATION_PROMPT)
    )
    pipeline.add_component("generator", create_generator(temperature=LLM_CONFIG["flashcard_temperature"]))
    pipeline.add_component("flashcard_parser", FlashcardParser())

    # Specify the exact connections between components
    pipeline.connect("pdf_extractor.text", "prompt_builder.documents")
    pipeline.connect("prompt_builder", "generator")
    pipeline.connect("generator", "flashcard_parser")
    
    return pipeline

def create_url_flashcard_pipeline() -> Pipeline:
    """
    Creates a pipeline that generates flashcards from web page content.
    
    Returns:
        Pipeline: A configured pipeline for URL-based flashcard generation
    """
    pipeline = Pipeline()
    pipeline.add_component("link_content_fetcher", LinkContentFetcher())
    pipeline.add_component("html_converter", HTMLToDocument())
    pipeline.add_component(
        "prompt_builder", PromptBuilder(template=FLASHCARD_GENERATION_PROMPT)
    )
    pipeline.add_component("generator", create_generator(temperature=LLM_CONFIG["flashcard_temperature"]))
    pipeline.add_component("flashcard_parser", FlashcardParser())

    # Specify the exact connections between components
    pipeline.connect("link_content_fetcher", "html_converter")
    pipeline.connect("html_converter", "prompt_builder")
    pipeline.connect("prompt_builder", "generator")
    pipeline.connect("generator", "flashcard_parser")
    
    return pipeline

# Create instances of the flashcard pipelines
pdf_flashcard_generation_pipeline = create_pdf_flashcard_pipeline()
url_flashcard_generation_pipeline = create_url_flashcard_pipeline()

# ==================== Essay QA PIPELINES ====================

def create_pdf_essay_qa_pipeline() -> Pipeline:
    """
    Creates a pipeline that generates essay-type questions with detailed answers from PDF content.
    
    Returns:
        Pipeline: A configured pipeline for PDF-based Essay QA generation
    """
    pipeline = Pipeline()
    pipeline.add_component("pdf_extractor", PDFTextExtractor())
    pipeline.add_component(
        "prompt_builder", PromptBuilder(template=Essay_QA_PROMPT)
    )
    pipeline.add_component("generator", create_generator(temperature=LLM_CONFIG["essay_qa_temperature"]))
    pipeline.add_component("essay_qa_parser", EssayQAParser())

    # Specify the exact connections between components
    pipeline.connect("pdf_extractor.text", "prompt_builder.documents")
    pipeline.connect("prompt_builder", "generator")
    pipeline.connect("generator", "essay_qa_parser")
    
    return pipeline

def create_url_essay_qa_pipeline() -> Pipeline:
    """
    Creates a pipeline that generates essay-type questions with detailed answers from web page content.
    
    Returns:
        Pipeline: A configured pipeline for URL-based Essay QA generation
    """
    pipeline = Pipeline()
    pipeline.add_component("link_content_fetcher", LinkContentFetcher())
    pipeline.add_component("html_converter", HTMLToDocument())
    pipeline.add_component(
        "prompt_builder", PromptBuilder(template=Essay_QA_PROMPT)
    )
    pipeline.add_component("generator", create_generator(temperature=LLM_CONFIG["essay_qa_temperature"]))
    pipeline.add_component("essay_qa_parser", EssayQAParser())

    # Specify the exact connections between components
    pipeline.connect("link_content_fetcher", "html_converter")
    pipeline.connect("html_converter", "prompt_builder")
    pipeline.connect("prompt_builder", "generator")
    pipeline.connect("generator", "essay_qa_parser")
    
    return pipeline

# Create instances of the Essay QA pipelines
pdf_essay_qa_generation_pipeline = create_pdf_essay_qa_pipeline()
url_essay_qa_generation_pipeline = create_url_essay_qa_pipeline() 