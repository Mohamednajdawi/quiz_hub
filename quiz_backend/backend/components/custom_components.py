import json
import os
from typing import Dict, List

import json_repair
from haystack import component
from pypdf import PdfReader

@component
class PDFTextExtractor:
    @component.output_types(text=str, filename=str)
    def run(self, file_path: str):
        """
        Extract text from a PDF file.
        
        Args:
            file_path: Path to the PDF file
            
        Returns:
            dict: A dictionary containing the extracted text and the filename
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found: {file_path}")
            
        reader = PdfReader(file_path)
        text = ""
        
        # Extract text from each page
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:  # Only add non-empty pages
                text += page_text + "\n\n"
            
        # If text is still empty, the PDF might be scanned or have image-based content
        if not text.strip():
            print("Warning: Extracted text is empty. The PDF might be scanned or contain only images.")
            raise ValueError("The PDF appears to contain no extractable text. It may be a scanned document or contain only images. Please use a text-based PDF or convert the scanned PDF to text first.")
            
        filename = os.path.basename(file_path)
        print(f"Extracted {len(text)} characters from {filename}")
        
        # Return with the key 'text' to match the output_types declaration
        return {"text": text, "filename": filename}

@component
class QuizParser:
    @component.output_types(quiz=Dict)
    def run(self, replies: List[str]):
        reply = replies[0]

        # even if prompted to respond with JSON only, sometimes the model returns a mix of JSON and text
        first_index = min(reply.find("{"), reply.find("["))
        last_index = max(reply.rfind("}"), reply.rfind("]")) + 1

        json_portion = reply[first_index:last_index]

        try:
            quiz = json.loads(json_portion)
        except json.JSONDecodeError:
            # if the JSON is not well-formed, try to repair it
            quiz = json_repair.loads(json_portion)

        # sometimes the JSON contains a list instead of a dictionary
        if isinstance(quiz, list):
            quiz = quiz[0]

        print(quiz)

        return {"quiz": quiz}

@component
class FlashcardParser:
    @component.output_types(flashcards=Dict)
    def run(self, replies: List[str]):
        """
        Parse the LLM's response to extract flashcard data in JSON format.
        
        Args:
            replies: List of strings containing the LLM's response
            
        Returns:
            dict: A dictionary containing the parsed flashcards
        """
        reply = replies[0]

        # Extract the JSON portion from the response
        first_index = min(reply.find("{"), reply.find("["))
        last_index = max(reply.rfind("}"), reply.rfind("]")) + 1

        json_portion = reply[first_index:last_index]

        try:
            flashcards = json.loads(json_portion)
        except json.JSONDecodeError:
            # If the JSON is not well-formed, try to repair it
            flashcards = json_repair.loads(json_portion)

        # Handle if the response is a list instead of a dictionary
        if isinstance(flashcards, list):
            flashcards = {"cards": flashcards}
            
        # Ensure the required fields exist
        if "subcategory" not in flashcards:
            flashcards["subcategory"] = "General"
            
        # Validate cards structure
        if "cards" not in flashcards:
            if "flashcards" in flashcards:
                flashcards["cards"] = flashcards.pop("flashcards")
            else:
                flashcards["cards"] = []

        print(flashcards)
        
        return {"flashcards": flashcards}

@component
class EssayQAParser:
    @component.output_types(essay_qa=Dict)
    def run(self, replies: List[str]):
        """
        Parse the LLM's response to extract Essay QA data in JSON format.
        
        Args:
            replies: List of strings containing the LLM's response
            
        Returns:
            dict: A dictionary containing the parsed Essay QA questions
        """
        reply = replies[0]

        # Extract the JSON portion from the response
        first_index = min(reply.find("{"), reply.find("[")) if reply.find("{") != -1 and reply.find("[") != -1 else max(reply.find("{"), reply.find("["))
        last_index = max(reply.rfind("}"), reply.rfind("]")) + 1

        json_portion = reply[first_index:last_index]

        try:
            essay_qa = json.loads(json_portion)
        except json.JSONDecodeError:
            # If the JSON is not well-formed, try to repair it
            essay_qa = json_repair.loads(json_portion)

        # Handle if the response is a list instead of a dictionary
        if isinstance(essay_qa, list):
            essay_qa = {"questions": essay_qa}
            
        # Ensure the required fields exist
        if "subcategory" not in essay_qa:
            essay_qa["subcategory"] = "General"
            
        # Validate questions structure
        if "questions" not in essay_qa:
            essay_qa["questions"] = []
            
        # Ensure each question has the required fields
        for question in essay_qa.get("questions", []):
            if "key_info" not in question:
                question["key_info"] = []
            if "full_answer" not in question:
                question["full_answer"] = ""

        print(essay_qa)
        
        return {"essay_qa": essay_qa}


@component
class MindMapParser:
    @component.output_types(mind_map=Dict)
    def run(self, replies: List[str]):
        """
        Parse the LLM response for mind map generation.
        Ensures nodes/edges arrays are present even if missing from the payload.
        """
        reply = replies[0]

        first_index_candidates = [idx for idx in (reply.find("{"), reply.find("[")) if idx != -1]
        if not first_index_candidates:
            raise ValueError("Mind map response did not contain JSON content")
        first_index = min(first_index_candidates)
        last_index = max(reply.rfind("}"), reply.rfind("]")) + 1

        json_portion = reply[first_index:last_index]

        try:
            mind_map = json.loads(json_portion)
        except json.JSONDecodeError:
            mind_map = json_repair.loads(json_portion)

        if isinstance(mind_map, list):
            mind_map = mind_map[0] if mind_map else {}

        mind_map.setdefault("key_concepts", [])
        mind_map.setdefault("nodes", [])
        mind_map.setdefault("edges", [])
        mind_map.setdefault("connections", [])
        mind_map.setdefault("callouts", [])
        mind_map.setdefault("recommended_next_steps", [])

        return {"mind_map": mind_map}