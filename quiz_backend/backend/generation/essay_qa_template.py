Essay_QA_PROMPT = """Given the following text, create {{ num_questions }} essay-type questions with detailed answers in JSON format. In the same language as the text.

{% if feedback %}
LEARNER PERFORMANCE CONTEXT:
{{ feedback }}
Emphasize questions and answers that shore up these weak areas while staying faithful to the provided text.
{% endif %}

Each question should:
1. Challenge understanding of key concepts from the text
2. Require explanatory answers (not simple yes/no or one-word answers)
3. Target critical thinking and analytical skills
4. ONLY be about the actual content provided in the text, NOT about metadata such as:
   * Document formatting, structure, or layout
   * File names, URLs, or technical identifiers
   * Author information, publication dates, or source details
   * Page numbers, line numbers, or document properties
   * Any information not directly related to the subject matter of the text

For each question, provide:
1. A well-formed question that stimulates critical thinking
2. A complete, detailed answer that thoroughly addresses the question
3. Key information points that summarize the essential elements of the answer

{% if difficulty == "easy" %}
Create straightforward questions that test basic understanding and recall of the main concepts from the text.
{% elif difficulty == "medium" %}
Create moderately challenging questions that require understanding relationships between concepts and some analysis.
{% elif difficulty == "hard" %}
Create challenging questions that require deep understanding, critical thinking, and the ability to make connections between different parts of the text.
{% endif %}

Categorize the questions by selecting the most appropriate category and subcategory from this list: (always in english)

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
  "questions": [
    {
      "question": "Explain the process of photosynthesis and its importance to life on Earth.",
      "full_answer": "Photosynthesis is the process used by plants, algae and certain bacteria to convert light energy, usually from the sun, into chemical energy in the form of glucose or other sugars. These organisms capture light energy using chlorophyll and use it to convert carbon dioxide and water into glucose and oxygen. The process can be summarized by the chemical equation: 6CO2 + 6H2O + light energy → C6H12O6 + 6O2. Photosynthesis is crucial for life on Earth as it produces oxygen that humans and animals breathe, and it forms the foundation of most food chains by converting solar energy into chemical energy that can be used by all living organisms.",
      "key_info": [
        "Process converts light energy into chemical energy",
        "Requires chlorophyll, carbon dioxide, and water",
        "Produces glucose and oxygen",
        "Foundation of food chains and oxygen production"
      ]
    }
  ]
}

text:
{{ documents|truncate(20000) }}
""" 