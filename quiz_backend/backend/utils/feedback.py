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
            status = "correct" if entry["is_correct"] else "incorrect"
            details_text_lines.append(
                f"{entry['number']}. {entry['question']}\n"
                f"   - User answer: {entry['user_answer']}\n"
                f"   - Correct answer: {entry['correct_answer']}\n"
                f"   - Result: {status}"
            )
        question_context = "\n".join(details_text_lines)
    else:
        question_context = "No question-level details were available."

    time_taken_text = _format_time(time_taken_seconds)
    summary_text = (
        f"Quiz topic: {topic_name}\n"
        f"Score: {score}/{total_questions} ({percentage:.1f}%)\n"
        f"Time taken: {time_taken_text}\n"
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
                        "Given quiz performance data, provide constructive feedback in one paragraph. "
                        "Highlight strengths briefly, focus on areas for improvement, and end with an encouraging action step. "
                        "Avoid bullet points; write in 3-5 sentences."
                    ),
                },
                {
                    "role": "user",
                    "content": summary_text,
                },
            ],
            max_tokens=250,
            temperature=0.6,
        )

        message = response.choices[0].message.content if response.choices else None
        if not message:
            logging.warning("[QUIZ FEEDBACK] OpenAI returned no feedback content.")
            return None
        return message.strip()
    except Exception as exc:  # pylint: disable=broad-except
        logging.error("[QUIZ FEEDBACK] Failed to generate feedback: %s", exc)
        return None

