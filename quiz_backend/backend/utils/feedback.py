import logging
import os
import re
from collections import Counter, defaultdict
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


def _derive_topic_label(raw_value: str) -> str:
    """
    Try to convert question/concept text into a short topic label without question numbers.
    """
    if not raw_value:
        return ""
    label = raw_value.strip()
    # Remove leading "Question X: " patterns
    label = re.sub(r"^question\s*\d+[:\-\s]*", "", label, flags=re.IGNORECASE).strip()
    # If everything was stripped, fall back to original description
    return label or raw_value.strip()


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
        base_topic_text = detail.get("concept") or detail.get("topic") or detail.get("question") or ""
        entry = {
            "number": detail.get("number"),
            "question": detail.get("question"),
            "user_answer": detail.get("user_answer") or "Not answered",
            "correct_answer": detail.get("correct_answer") or "Unknown",
            "is_correct": bool(detail.get("is_correct")),
            "concept": detail.get("concept") or detail.get("topic") or "",
            "topic_label": _derive_topic_label(base_topic_text),
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

    # Identify weak topics (most frequently missed concepts/questions)
    weak_topic_counter: Counter[str] = Counter()
    weak_topic_examples: dict[str, list[str]] = defaultdict(list)
    weak_topic_labels: dict[str, str] = {}
    for entry in incorrect:
        topic_key = entry["concept"] or entry["question"] or f"Question {entry['number']}"
        weak_topic_counter[topic_key] += 1
        if topic_key not in weak_topic_labels:
            weak_topic_labels[topic_key] = entry["topic_label"] or topic_key
        if len(weak_topic_examples[topic_key]) < 2:
            weak_topic_examples[topic_key].append(
                f"Q{entry['number']}: {entry['question']}"
            )

    top_weak_topics = weak_topic_counter.most_common(3)
    top_weak_topic_labels = [weak_topic_labels.get(topic_key, topic_key) for topic_key, _ in top_weak_topics]
    weak_topic_summary_lines = []
    for topic_key, misses in top_weak_topics:
        examples = "; ".join(weak_topic_examples.get(topic_key, []))
        weak_topic_summary_lines.append(
            f"- {topic_key} | missed {misses} time(s). Examples: {examples}"
        )
    weak_topic_summary = (
        "\n".join(weak_topic_summary_lines) if weak_topic_summary_lines else "No weak topics detected."
    )

    # Identify focus topics (up to 2 most recent incorrect answers)
    focus_topics = []
    for entry in incorrect[:2]:
        if entry["topic_label"]:
            focus_topics.append(entry["topic_label"])
        elif entry["concept"]:
            focus_topics.append(entry["concept"])
        else:
            focus_topics.append(entry["question"])
    focus_text = "; ".join(focus_topics) if focus_topics else "No particular gaps detected"

    def _recommend_adaptive_difficulty() -> tuple[str, str]:
        if percentage >= 85:
            return "hard", "Performance is excellent; increase challenge to push mastery."
        if percentage >= 60:
            return (
                "medium",
                "Core understanding is forming; maintain medium difficulty while shoring up weak areas.",
            )
        return "easy", "Focus on rebuilding confidence and fundamentals before moving up."

    recommended_difficulty_level, recommended_difficulty_reason = _recommend_adaptive_difficulty()
    time_taken_text = _format_time(time_taken_seconds)
    avg_seconds_per_question = (
        time_taken_seconds / total_questions if total_questions > 0 else time_taken_seconds
    )
    weak_topic_name_list = ", ".join(label for label in top_weak_topic_labels if label) or topic_name
    study_seed_lines = [
        f"- Flashcards focus: {weak_topic_name_list}",
        f"- Targeted quizzes focus: {focus_text}",
        "- Deep reading focus: revisit the source material sections tied to the above weak topics.",
    ]

    summary_text_lines = [
        f"Quiz topic: {topic_name}",
        f"Score: {score}/{total_questions} ({percentage:.1f}%)",
        f"Time taken: {time_taken_text} (≈{avg_seconds_per_question:.1f}s/question)",
        f"Primary focus areas: {focus_text}",
        f"Weak topic stats:\n{weak_topic_summary}",
        "Study plan seeds:",
        *study_seed_lines,
        f"Adaptive difficulty recommendation: {recommended_difficulty_level.upper()} — {recommended_difficulty_reason}",
        f"Question insights:\n{question_context}",
    ]
    summary_text = "\n".join(summary_text_lines)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an encouraging study coach. "
                        "Given quiz performance data, respond using the EXACT template:\n"
                        "Mistake Analysis: <2 sentences about the biggest mistakes referencing provided insights.>\n"
                        "Weak Topics:\n"
                        "- <Topic 1 and what went wrong>\n"
                        "- <Topic 2>\n"
                        "Study Plan:\n"
                        "- Flashcards: <Personalized card practice tied to weak topics>\n"
                        "- Targeted Quizzes: <Specific quiz actions tied to weak topics>\n"
                        "- Deep Reading: <Specific reading/review guidance>\n"
                        "Adaptive Difficulty: <State the recommended difficulty level provided in the context and why.>\n"
                        "Requirements:\n"
                        "- Bold key skills, topics, or action verbs using **double asterisks**.\n"
                        "- Mention that the plan is automatically generated for the learner.\n"
                        "- Keep total length under 1200 characters.\n"
                        "- Do not add extra sections or bullet groups beyond the template.\n"
                        "- Work the provided study plan seeds into your guidance naturally.\n"
                        "- Never reference question numbers (like 'Question 2'); instead, restate the topic/skill names provided in the context.\n"
                        "- Each Study Plan bullet should start with 'Focus on' followed by the topic name (e.g., 'Focus on **photosynthesis basics** by...').\n"
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
   
2. Constructive feedback that:
   - Acknowledges what the student did well
   - Points out what's missing or incorrect
   - Provides specific guidance on how to improve
   - Uses **bold** formatting for key concepts or action items
   - States that the personalized plan below is automatically generated
   - Follows this exact template (keep each bullet to 1-2 sentences):
     Mistake Analysis: ...
     Weak Topics:
     - ...
     - ...
     Study Plan:
     - Flashcards: ...
     - Targeted Quizzes: ...
     - Deep Reading: ...
     Adaptive Difficulty: ...
   - For Adaptive Difficulty, infer the level (easy/medium/hard) using the score you assign (>=85 = hard, 60-84 = medium, else easy) and explain the adjustment.
   - Never mention question numbers; paraphrase the topic/skill names from the prompt when referring to weaknesses.
   - Each Study Plan bullet should start with 'Focus on' followed by the topic/skill (e.g., "Focus on **cell structure** by...").
   
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
                        "Ensure the feedback text strictly follows the requested template so the learner sees: "
                        "Mistake Analysis, Weak Topics (bullets), Study Plan (Flashcards/Targeted Quizzes/Deep Reading), and Adaptive Difficulty. "
                        "Never reference question numbers; instead, restate the underlying topic/skill names and start each Study Plan bullet with 'Focus on ...'."
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


def generate_combined_essay_feedback(
    *,
    questions_and_answers: list[dict],
) -> tuple[Optional[str], Optional[float]]:
    """
    Generate combined feedback and score for multiple essay answers using LLM.
    
    Args:
        questions_and_answers: List of dicts, each containing:
            - question: str
            - user_answer: str
            - correct_answer: str
            - key_info: list[str]
    
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
    
    # Build the prompt with all questions and answers
    qa_sections = []
    for idx, qa in enumerate(questions_and_answers, 1):
        question = qa.get("question", "")
        user_answer = qa.get("user_answer", "")
        correct_answer = qa.get("correct_answer", "")
        key_info = qa.get("key_info", [])
        key_info_text = "\n".join([f"- {info}" for info in key_info]) if key_info else "No specific key points provided."
        
        qa_sections.append(f"""Question {idx}: {question}

Expected Answer (Reference):
{correct_answer}

Key Information Points to Cover:
{key_info_text}

Student's Answer:
{user_answer}
""")
    
    all_qa_text = "\n" + "="*50 + "\n".join(qa_sections) + "="*50
    
    prompt_text = f"""You are evaluating a student's complete essay response set. The student has answered {len(questions_and_answers)} questions.{all_qa_text}

Please evaluate ALL answers together and provide:
1. A single overall score from 0-100 based on:
   - Overall accuracy and correctness across all answers
   - Coverage of key information points across all questions
   - Consistency and coherence across answers
   - Clarity and organization throughout
   - Depth of understanding demonstrated overall
   
2. Comprehensive feedback that:
   - Acknowledges what the student did well across all answers
   - Points out what's missing or incorrect across the responses
   - Provides specific guidance on how to improve overall
   - Uses **bold** formatting for key concepts or action items
   - Addresses the complete set of answers, not individual questions
   - States that the personalized plan below is automatically generated
   - Follows this exact template (keep each bullet to 1-2 sentences):
     Mistake Analysis: ...
     Weak Topics:
     - ...
     - ...
     Study Plan:
     - Flashcards: ...
     - Targeted Quizzes: ...
     - Deep Reading: ...
     Adaptive Difficulty: ...
   - For Adaptive Difficulty, infer the level (easy/medium/hard) using the score you assign (>=85 = hard, 60-84 = medium, else easy) and explain the adjustment.
   - Never mention question numbers; paraphrase the underlying topic/skill names from the prompts.
   - Each Study Plan bullet should start with 'Focus on' followed by the topic/skill.
   
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
                        "Evaluate the complete set of essay answers together and provide overall feedback. "
                        "Always return valid JSON with 'score' (0-100) and 'feedback' (string) fields. "
                        "Ensure the feedback string follows the required template exactly so the learner always sees Mistake Analysis, Weak Topics (bullets), Study Plan (Flashcards/Targeted Quizzes/Deep Reading), and Adaptive Difficulty. "
                        "Provide one overall assessment, not per-question feedback. "
                        "Never reference question numbers; instead, restate the topic/skill names and start each Study Plan bullet with 'Focus on ...'."
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
        logging.error("[ESSAY FEEDBACK] Failed to generate combined feedback: %s", exc)
        return None, None

