QUIZ_GENERATION_PROMPT = """{% if auto_question_mode %}
Given the following text, create a well-balanced set of multiple choice quizzes in JSON format with {{ difficulty }} difficulty level in the same language as the text. Choose an appropriate number of high-quality questions (typically 6-10) that cover the breadth of the material and avoid redundancy.
{% else %}
Given the following text, create {{ num_questions }} multiple choice quizzes in JSON format with {{ difficulty }} difficulty level in the same language as the text.
{% endif %}

{% if feedback %}
LEARNER WEAKNESSES TO TARGET:
{{ feedback }}
Prioritize generating questions that revisit these weak areas while still covering the breadth of the provided text.
{% endif %}

CRITICAL: ANSWER POSITION RANDOMIZATION
To ensure quiz quality and prevent patterns, you MUST randomize the position of correct answers:
- Distribute correct answers roughly equally across all positions (a, b, c, d)
- NEVER place the majority of correct answers in position 'b' or any single position
- Before finalizing, verify that correct answers are well-distributed across all four positions
- The correct answer position should feel unpredictable and natural

DIFFICULTY GUIDELINES:
{% if difficulty == "easy" %}
Create straightforward questions that test basic understanding and recall of the main concepts from the text. Focus on:
- Direct facts and definitions explicitly stated in the text
- Simple cause-and-effect relationships clearly described
- Basic identification of key terms, people, or events
- Main ideas and obvious details from the text
- Chronological sequences or basic processes

Keep distractors plausible but clearly incorrect for someone who read the text carefully.
{% elif difficulty == "medium" %}
Create moderately challenging questions that require understanding relationships between concepts and some analysis. Focus on:
- Connecting ideas across different parts of the text
- Understanding implications, consequences, and significance
- Comparing and contrasting concepts or approaches
- Identifying patterns or trends described in the text
- Applying knowledge to slightly different contexts
- Understanding the "why" behind the "what"

Distractors should be plausible and may include common misconceptions or partial truths.
{% elif difficulty == "hard" %}
Create challenging questions that require deep understanding, critical thinking, and synthesis. Focus on:
- Complex analytical reasoning across multiple concepts
- Synthesis of ideas from different sections of the text
- Evaluation of arguments, evidence, or methodologies
- Drawing sophisticated inferences from stated information
- Understanding broader implications, limitations, or contexts
- Identifying underlying assumptions or principles
- Analyzing cause-and-effect chains with multiple steps

Distractors should be sophisticated and potentially correct-sounding, requiring careful analysis to eliminate.
{% endif %}

QUESTION QUALITY REQUIREMENTS:
1. **Content Coverage**: Distribute questions across the entire text, not just the beginning or end
2. **Independence**: Each question must stand alone without providing clues to other answers
3. **Clarity**: Use precise, unambiguous language with clear question stems
4. **Relevance**: Focus ONLY on the substantive content, NOT on:
   - Document metadata (filenames, URLs, dates, authors)
   - Formatting or structural elements
   - Page numbers, line numbers, or technical identifiers
   - Information not present in the provided text

ANSWER OPTIONS REQUIREMENTS:
- Provide exactly 4 options labeled a, b, c, d (lowercase letter, period, space, then text)
- **RANDOMIZE the position of the correct answer** - avoid patterns or preferences
- All distractors must be:
  * Plausible and grammatically parallel to the correct answer
  * Similar in length and complexity to the correct answer
  * Based on related concepts from the text (not random/absurd choices)
  * Incorrect but potentially tempting without careful reading
- Avoid obvious elimination cues:
  * "All of the above" or "None of the above"
  * Absolute terms like "always," "never," "only" (unless accurate)
  * Significantly longer or more detailed correct answers
  * Repetitive language that gives away the answer

CATEGORIZATION GUIDELINES:
Select the most specific and appropriate category/subcategory pair from this taxonomy (use English):

**1. General Knowledge**
- History & Politics
- Science & Technology  
- World Cultures & Traditions

**2. Entertainment**
- Movies & TV Shows
- Music & Concerts
- Celebrity Trivia

**3. Sports**
- Team Sports (Soccer, Football, Basketball, etc.)
- Individual Sports (Tennis, Golf, Athletics, etc.)
- Extreme/Adventure Sports

**4. History**
- Ancient Civilizations
- Medieval & Renaissance
- Modern & Contemporary Events

**5. Science & Nature**
- Biology & Ecology
- Chemistry & Physics
- Space & Astronomy
- Technology & Innovation

**6. Geography**
- World Capitals & Countries
- Physical Geography (mountains, rivers, oceans)
- Famous Landmarks & Natural Wonders

**7. Pop Culture & Media**
- Social Media Trends & Viral Memes
- Internet Culture & Viral Challenges
- Celebrity Gossip & Reality TV

**8. Education & Learning**
- Academic Subjects
- Professional Development
- Research & Studies

FORMATTING EXAMPLES:

**Example 1 - Easy Level** (Note: correct answer is 'c')
Topic: Photosynthesis in Plants
{
  "question": "According to the text about photosynthesis, what do plants primarily use to convert carbon dioxide and water into glucose?",
  "options": [
    "a. Moonlight and minerals",
    "b. Wind and soil nutrients",
    "c. Sunlight and chlorophyll",
    "d. Heat and oxygen"
  ],
  "right_option": "c"
}

**Example 2 - Medium Level** (Note: correct answer is 'd')
Topic: The French Revolution
{
  "question": "Based on the text's discussion of the French Revolution, what was the primary relationship between the economic crisis and the political upheaval?",
  "options": [
    "a. The economic crisis occurred after the revolution had already begun",
    "b. Political changes caused the economic crisis rather than the reverse",
    "c. Only the nobility and clergy were significantly affected by economic problems",
    "d. Economic hardship created conditions that made revolutionary ideas more appealing to the masses"
  ],
  "right_option": "d"
}

**Example 3 - Hard Level** (Note: correct answer is 'a')
Topic: Artificial Intelligence Ethics
{
  "question": "According to the text's analysis of AI ethics, what fundamental tension exists between algorithmic efficiency and fairness that makes this challenge particularly difficult to resolve?",
  "options": [
    "a. Efficient algorithms optimize for patterns in historical data, which may encode and perpetuate existing societal biases",
    "b. Fair algorithms require significantly more computational resources than efficient algorithms in all cases",
    "c. Fairness metrics are inherently subjective while efficiency can be objectively measured",
    "d. The tension exists only in theoretical discussions but has been solved in practical implementations"
  ],
  "right_option": "a"
}

RESPONSE FORMAT:
**Output JSON only - no markdown code blocks, no explanatory text, no preamble.**

Required structure:
{
  "topic": "A clear, descriptive title reflecting the main subject of the text",
  "category": "Select from the 8 main categories listed above",
  "subcategory": "Select the appropriate subcategory from the chosen category",
  "questions": [
    {
      "question": "Complete question text with context",
      "options": [
        "a. first option",
        "b. second option", 
        "c. third option",
        "d. fourth option"
      ],
      "right_option": "a single lowercase letter: a, b, c, or d"
    }
  ]
}

**FINAL CHECKLIST before responding:**
✓ Correct answers are distributed across positions a, b, c, and d
✓ All questions are based solely on text content (no metadata)
✓ Options are parallel in structure and similar in length
✓ Distractors are plausible and related to the topic
✓ Questions are independent and don't hint at other answers
✓ Difficulty level matches the specified tier
✓ Response is valid JSON with no extra formatting

TEXT TO ANALYZE:
{{ documents|truncate(20000) }}
"""