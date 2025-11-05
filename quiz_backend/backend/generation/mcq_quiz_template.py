QUIZ_GENERATION_PROMPT = """Given the following text, create {{ num_questions }} multiple choice quizzes in JSON format with {{ difficulty }} difficulty level in the same language as the text.

DIFFICULTY GUIDELINES:
{% if difficulty == "easy" %}
Create straightforward questions that test basic understanding and recall of the main concepts from the text. Focus on:
- Direct facts and definitions
- Simple cause-and-effect relationships
- Basic identification of key terms or people
- Obvious details explicitly stated in the text
{% elif difficulty == "medium" %}
Create moderately challenging questions that require understanding relationships between concepts and some analysis. Focus on:
- Connecting ideas across different parts of the text
- Understanding implications and consequences
- Comparing and contrasting concepts
- Applying knowledge to slightly different contexts
{% elif difficulty == "hard" %}
Create challenging questions that require deep understanding, critical thinking, subject knowledge, and the ability to make connections between different parts of the text. Focus on:
- Complex analytical reasoning
- Synthesis of multiple concepts
- Evaluation and judgment calls
- Drawing inferences not explicitly stated
- Understanding broader implications and contexts
{% endif %}

QUESTION REQUIREMENTS:
- Each question should have 4 different options with only one correct answer
- Options should be plausible and challenging (avoid obviously wrong answers)
- Each option must begin with a letter followed by a period and a space (e.g., "a. option")
- Questions should briefly mention the general topic for context
- Questions should be independent (no hints for other questions)
- Cover content from all parts of the text
- Use clear, unambiguous language
- Questions must ONLY be about the actual content provided in the text, NOT about metadata such as:
  * Document formatting, structure, or layout
  * File names, URLs, or technical identifiers
  * Author information, publication dates, or source details
  * Page numbers, line numbers, or document properties
  * Any information not directly related to the subject matter of the text

CATEGORIZATION:
Select the most appropriate category and subcategory from this list (always in English):

1. General Knowledge
• History & Politics
• Science & Technology
• World Cultures & Traditions

2. Entertainment
• Movies & TV Shows
• Music & Concerts
• Celebrity Trivia

3. Sports
• Team Sports (e.g. Soccer, Football, Basketball)
• Individual Sports (e.g. Tennis, Golf, Athletics)
• Extreme/Adventure Sports

4. History
• Ancient Civilizations
• Medieval & Renaissance
• Modern & Contemporary Events

5. Science & Nature
• Biology & Ecology
• Chemistry & Physics
• Space & Astronomy
• Technology & Innovation

6. Geography
• World Capitals & Countries
• Physical Geography (mountains, rivers, oceans)
• Famous Landmarks & Natural Wonders

7. Pop Culture & Media
• Social Media Trends & Viral Memes
• Internet Culture & Viral Challenges
• Celebrity Gossip & Reality TV

8. Education & Learning
• Academic Subjects
• Professional Development
• Research & Studies

EXAMPLES:

Example 1 - Easy Level (from a text about photosynthesis):
{
  "topic": "Photosynthesis in Plants",
  "category": "Science & Nature",
  "subcategory": "Biology & Ecology",
  "questions": [
    {
      "question": "According to the text about photosynthesis, what do plants primarily use to convert carbon dioxide and water into glucose?",
      "options": [
        "a. Moonlight and minerals",
        "b. Sunlight and chlorophyll", 
        "c. Wind and soil nutrients",
        "d. Heat and oxygen"
      ],
      "right_option": "b"
    }
  ]
}

Example 2 - Medium Level (from a text about the French Revolution):
{
  "topic": "The French Revolution",
  "category": "History",
  "subcategory": "Modern & Contemporary Events",
  "questions": [
    {
      "question": "Based on the text about the French Revolution, what was the primary relationship between the economic crisis and the political upheaval that followed?",
      "options": [
        "a. The economic crisis was completely separate from political events",
        "b. Economic hardship created conditions that made revolutionary ideas more appealing to the masses",
        "c. Political changes caused the economic crisis rather than the reverse",
        "d. Only the nobility were affected by economic problems"
      ],
      "right_option": "b"
    }
  ]
}

Example 3 - Hard Level (from a text about artificial intelligence ethics):
{
  "topic": "Artificial Intelligence Ethics",
  "category": "Science & Nature", 
  "subcategory": "Technology & Innovation",
  "questions": [
    {
      "question": "Given the AI ethics discussion in the text, what fundamental tension exists between algorithmic efficiency and fairness that makes this an ongoing challenge rather than a solved problem?",
      "options": [
        "a. Efficient algorithms inherently optimize for patterns in data, which may perpetuate historical biases present in training datasets",
        "b. Fair algorithms are always slower than efficient ones due to computational complexity",
        "c. There is no real tension since fairness and efficiency measure completely different things",
        "d. The tension only exists in theoretical discussions but not in practical applications"
      ],
      "right_option": "a"
    }
  ]
}

RESPONSE FORMAT:
Respond with JSON only, no markdown or additional text.

Required JSON structure:
{
  "topic": "a descriptive title that fits the topic of the text",
  "category": "one of the main categories from the list above",
  "subcategory": "the appropriate subcategory from the list above", 
  "questions": [
    {
      "question": "text of the question",
      "options": ["a. first option", "b. second option", "c. third option", "d. fourth option"],
      "right_option": "letter of the correct option (a, b, c, or d)"
    }
  ]
}

TEXT TO ANALYZE:
{{ documents|truncate(20000) }}
"""