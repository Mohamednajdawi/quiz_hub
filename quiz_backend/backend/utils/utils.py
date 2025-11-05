from typing import Any, Dict

from backend.pipelines.content_pipelines import (
    pdf_quiz_generation_pipeline, 
    url_quiz_generation_pipeline,
    pdf_flashcard_generation_pipeline,
    url_flashcard_generation_pipeline,
    pdf_essay_qa_generation_pipeline,
    url_essay_qa_generation_pipeline
)


def generate_quiz(
    url: str, num_questions: int = 5, difficulty: str = "medium"
) -> Dict[str, Any]:
    return url_quiz_generation_pipeline.run(
        {
            "link_content_fetcher": {"urls": [url]},
            "prompt_builder": {
                "num_questions": num_questions,
                "difficulty": difficulty,
            },
        }
    )["quiz_parser"]["quiz"]


def generate_quiz_from_pdf(
    pdf_path: str, num_questions: int = 5, difficulty: str = "medium"
) -> Dict[str, Any]:
    """
    Generate a quiz from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        num_questions: Number of questions to generate
        difficulty: Difficulty level of the questions (easy, medium, hard)
        
    Returns:
        dict: A dictionary containing the quiz data
    """
    return pdf_quiz_generation_pipeline.run(
        {
            "pdf_extractor": {"file_path": pdf_path},
            "prompt_builder": {
                "num_questions": num_questions,
                "difficulty": difficulty,
            },
        }
    )["quiz_parser"]["quiz"]


def generate_flashcards(url: str, num_cards: int = 10) -> Dict[str, Any]:
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
            },
        }
    )["flashcard_parser"]["flashcards"]


def generate_flashcards_from_pdf(pdf_path: str, num_cards: int = 10) -> Dict[str, Any]:
    """
    Generate flashcards from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        num_cards: Number of flashcards to generate (default: 10)
        
    Returns:
        dict: A dictionary containing the flashcard data
    """
    return pdf_flashcard_generation_pipeline.run(
        {
            "pdf_extractor": {"file_path": pdf_path},
            "prompt_builder": {
                "num_cards": num_cards,
            },
        }
    )["flashcard_parser"]["flashcards"]


def generate_essay_qa(
    url: str, num_questions: int = 3, difficulty: str = "medium"
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
            },
        }
    )["essay_qa_parser"]["essay_qa"]


def generate_essay_qa_from_pdf(
    pdf_path: str, num_questions: int = 3, difficulty: str = "medium"
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
            },
        }
    )["essay_qa_parser"]["essay_qa"]
