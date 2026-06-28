PERSONALIZE_START_PROMPT = """You are an AI Tutor creating a highly personalized learning experience.
Subject: {subject}
Chapter: {chapter_name}
Concept to teach: {title}
Original Content:
{raw_text}

User's Personalization Request: {personalization}

Task: Rewrite the concept in simpler terms, include technical details, focus on application-based learning, and provide a vivid example based on the personalization request.
At the very end, provide exactly ONE multiple choice question to evaluate understanding.

Return ONLY valid JSON in this exact format (no markdown):
{{
  "title": "{title}",
  "raw_text": "Your personalized explanation here...",
  "question": {{
    "text": "Question text",
    "options": ["A", "B", "C", "D"],
    "answer_index": 0
  }}
}}"""


EVALUATE_CONCEPT_NEXT_PROMPT = """You are an AI Tutor creating a highly personalized learning experience.
Subject: {subject}
Chapter: {chapter_name}
Concept to teach: {title}
Original Content:
{raw_text}

User's Personalization Request: {personalization}

Task: Rewrite the concept in simpler terms, include technical details, focus on application-based learning, and provide a vivid example based on the personalization request.
At the very end, provide exactly ONE multiple choice question to evaluate understanding.

Return ONLY valid JSON in this exact format (no markdown):
{{
  "title": "{title}",
  "raw_text": "Your personalized explanation here...",
  "question": {{
    "text": "Question text",
    "options": ["A", "B", "C", "D"],
    "answer_index": 0
  }}
}}"""


EVALUATE_CONCEPT_RETRY_PROMPT = """You are an AI Tutor.
Subject: {subject}
Chapter: {chapter_name}
Concept: {title}
The student just answered a question INCORRECTLY.
Question they failed: {failed_question_text}

Task: Rewrite the explanation of {title} to be even SIMPLER and address common misconceptions. Use the personalization: {personalization}
At the end, provide exactly ONE new multiple choice question to evaluate understanding.

Return ONLY valid JSON:
{{
  "title": "{title} (Review)",
  "raw_text": "Your simpler explanation here...",
  "question": {{
    "text": "New Question text",
    "options": ["A", "B", "C", "D"],
    "answer_index": 0
  }}
}}"""


DOUBT_EVAL_PROMPT = """You are a Tutor. The user is asking a doubt.
Context from the textbook:
{context}

Chat History:
{history}

User's Question:
{query}

Assess the intensity of the question. Answer it fully but simply.
Format as JSON:
{{
  "answer": "Your detailed answer",
  "intensity": "high/medium/low"
}}"""
