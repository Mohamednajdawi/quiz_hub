FLASHCARD_GENERATION_PROMPT = """Given the following text, create an appropriate number of flashcards with key concepts, terms, definitions, and important information. In the same language as the text.
{% if num_cards %}
Aim for approximately {{ num_cards }} flashcards, but adjust based on the content's complexity and depth.
{% endif %}

{% if feedback %}
Learner performance feedback indicates that the following areas need reinforcement:
{{ feedback }}
Prioritize creating flashcards that focus on clarifying, reinforcing, and drilling these weaker topics while still covering the essential content in the provided text.
{% endif %}

For each flashcard:
1. The front should contain a clear, concise question or term
2. The back should contain the answer, explanation, or definition
3. Focus on the most important information
4. Keep the flashcards simple and direct

Create flashcards that cover:
- Key concepts and principles
- Definitions of important terms
- Significant facts and figures
- Major relationships between ideas
- Essential processes or steps

IMPORTANT: Flashcards must ONLY be about the actual content provided in the text, NOT about metadata such as:
- Document formatting, structure, or layout
- File names, URLs, or technical identifiers
- Author information, publication dates, or source details
- Page numbers, line numbers, or document properties
- Any information not directly related to the subject matter of the text

Categorize the flashcards by selecting the most appropriate category and subcategory from this list: (always in english)

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

Respond with JSON only, no markdown or descriptions.

Example JSON format you should follow:
{
  "topic": "a title that fits the topic of the text",
  "category": "one of the main categories from the list",
  "subcategory": "the appropriate subcategory from the list",
  "cards": [
    {
      "front": "What is the capital of France?",
      "back": "Paris",
      "importance": "high"
    },
    {
      "front": "What year did World War II end?",
      "back": "1945",
      "importance": "medium"
    }
  ]
}

text:
{{ documents|truncate(20000) }}
""" 