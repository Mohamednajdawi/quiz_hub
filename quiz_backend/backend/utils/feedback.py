import logging
import os
from typing import Iterable, Optional

from openai import OpenAI


def _format_time(seconds: int) -> str:
    minutes = seconds // 60
    remaining_seconds = seconds % 60
    if minutes == 0:
        return f"{remaining_seconds} seconds"
    if remaining_seconds == 0:
        return f"{minutes} minutes"
    return f"{minutes} minutes and {remaining_seconds} seconds"


def generate_quiz_feedback(
    *,
    topic_name: str,
    score: int,
    total_questions: int,
    percentage: float,
    time_taken_seconds: int,
    question_details: Iterable[dict],
) -> Optional[str]:
    """
    Generate a one-paragraph feedback summary for a quiz attempt.

    Args:
        topic_name: Name of the quiz topic.
        score: Number of correct answers.
        total_questions: Total questions in the quiz.
        percentage: Percentage score.
        time_taken_seconds: Time taken to complete the quiz.
        question_details: Iterable of dictionaries containing question insight. Each dict should include:
            - number (int)
            - question (str)
            - correct_answer (str | None)
            - user_answer (str | None)
            - is_correct (bool)

    Returns:
        A single-paragraph feedback string, or None if generation fails or API key missing.
    """

    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPEN_API_KEY")
    if not api_key:
        logging.warning("[QUIZ FEEDBACK] OPENAI_API_KEY not configured; skipping AI feedback generation.")
        return None

    client = OpenAI(api_key=api_key)
    model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini-2025-04-14")

    # Prepare question summaries (focus on incorrect answers first)
    incorrect = []
    correct = []
    for detail in question_details:
        entry = {
            "number": detail.get("number"),
            "question": detail.get("question"),
            "user_answer": detail.get("user_answer") or "Not answered",
            "correct_answer": detail.get("correct_answer") or "Unknown",
            "is_correct": bool(detail.get("is_correct")),
            "concept": detail.get("concept") or detail.get("topic") or "",
        }
        if entry["is_correct"]:
            correct.append(entry)
        else:
            incorrect.append(entry)

    # Limit amount of context to keep prompt concise
    context_entries = incorrect[:5]  # Prioritize incorrect answers (up to 5)
    if len(context_entries) < 5:
        remaining_slots = 5 - len(context_entries)
        context_entries.extend(correct[:remaining_slots])

    if context_entries:
        details_text_lines = []
        for entry in context_entries:
            status_icon = "✅" if entry["is_correct"] else "❌"
            concept_prefix = f"[Concept: {entry['concept']}] " if entry["concept"] else ""
            details_text_lines.append(
                f"{status_icon} Q{entry['number']}: {concept_prefix}{entry['question']} | "
                f"User: {entry['user_answer']} | Correct: {entry['correct_answer']}"
            )
        question_context = "\n".join(details_text_lines)
    else:
        question_context = "No question-level details were available."

    # Identify focus topics (up to 2 most recent incorrect answers)
    focus_topics = []
    for entry in incorrect[:2]:
        if entry["concept"]:
            focus_topics.append(entry["concept"])
        else:
            focus_topics.append(entry["question"])
    focus_text = "; ".join(focus_topics) if focus_topics else "No particular gaps detected"

    time_taken_text = _format_time(time_taken_seconds)
    summary_text = (
        f"Quiz topic: {topic_name}\n"
        f"Score: {score}/{total_questions} ({percentage:.1f}%)\n"
        f"Time taken: {time_taken_text}\n"
        f"Primary focus areas: {focus_text}\n"
        f"Question insights:\n{question_context}\n"
    )

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an encouraging study coach. "
                        "Given quiz performance data, provide constructive feedback in ONE paragraph (3-5 sentences). "
                        "Always include a sentence that starts with 'Focus on' that references the weak topics. "
                        "Bold key skills, topics, or action verbs using **double asterisks**. "
                        "Acknowledge strengths briefly, then emphasize what to improve and close with a motivating action step. "
                        "Do not use bullet points or numbered lists."
                        "Example"
                        "Example: Focus on the concept of 'The French Revolution' in history. since you got the question wrong."
                        "Example: Focus on the concept of 'Artificial Intelligence Ethics' in science. since you got the question wrong."
                        "Example: Focus on the concept of 'The French Revolution' in history. since you got the question wrong."
                    ),
                },
                {
                    "role": "user",
                    "content": summary_text,
                },
            ],
            max_tokens=2000,
            temperature=0.2,
        )

        message = response.choices[0].message.content if response.choices else None
        if not message:
            logging.warning("[QUIZ FEEDBACK] OpenAI returned no feedback content.")
            return None
        return message.strip()
    except Exception as exc:  # pylint: disable=broad-except
        logging.error("[QUIZ FEEDBACK] Failed to generate feedback: %s", exc)
        return None


def generate_essay_feedback(
    *,
    question: str,
    user_answer: str,
    correct_answer: str,
    key_info: list[str],
) -> tuple[Optional[str], Optional[float]]:
    """
    Generate feedback and score for an essay answer using LLM.
    
    Args:
        question: The essay question
        user_answer: The user's answer
        correct_answer: The correct/expected answer
        key_info: List of key information points that should be covered
        
    Returns:
        A tuple of (feedback_string, score_percentage) or (None, None) if generation fails.
        Score is a float between 0-100.
    """
    
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("OPEN_API_KEY")
    if not api_key:
        logging.warning("[ESSAY FEEDBACK] OPENAI_API_KEY not configured; skipping AI feedback generation.")
        return None, None
    
    client = OpenAI(api_key=api_key)
    model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini-2025-04-14")
    
    # Format key info points
    key_info_text = "\n".join([f"- {info}" for info in key_info]) if key_info else "No specific key points provided."
    
    # Prepare the prompt
    prompt_text = f"""Question: {question}

Expected Answer (Reference):
{correct_answer}

Key Information Points to Cover:
{key_info_text}

Student's Answer:
{user_answer}

Please evaluate the student's answer and provide:
1. A score from 0-100 based on:
   - Accuracy and correctness of the information
   - Coverage of key information points
   - Clarity and organization
   - Depth of understanding demonstrated
   
2. Constructive feedback (2-4 sentences) that:
   - Acknowledges what the student did well
   - Points out what's missing or incorrect
   - Provides specific guidance on how to improve
   - Uses **bold** formatting for key concepts or action items
   
Format your response as JSON:
{{
  "score": <number 0-100>,
  "feedback": "<feedback text with markdown formatting>"
}}"""
    
    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an encouraging and constructive educator. "
                        "Evaluate essay answers fairly and provide helpful feedback. "
                        "Always return valid JSON with 'score' (0-100) and 'feedback' (string) fields. "
                        "Use **bold** formatting in feedback for emphasis on key concepts or action items."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt_text,
                },
            ],
            max_tokens=2000,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        
        message = response.choices[0].message.content if response.choices else None
        if not message:
            logging.warning("[ESSAY FEEDBACK] OpenAI returned no feedback content.")
            return None, None
        
        # Parse JSON response
        import json
        try:
            result = json.loads(message)
            score = float(result.get("score", 0))
            feedback = result.get("feedback", "")
            
            # Validate score range
            score = max(0, min(100, score))
            
            return feedback.strip(), score
        except (json.JSONDecodeError, ValueError, KeyError) as e:
            logging.error("[ESSAY FEEDBACK] Failed to parse JSON response: %s. Raw response: %s", e, message)
            # Fallback: try to extract score and feedback from text
            return message.strip(), None
            
    except Exception as exc:  # pylint: disable=broad-except
        logging.error("[ESSAY FEEDBACK] Failed to generate feedback: %s", exc)
        return None, None

