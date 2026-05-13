"""
quiz_gen.py
-----------
WHAT: Generates multiple-choice and short-answer quiz questions from course docs.
WHY:  Active recall (testing yourself) is one of the most effective study methods.
      The AI generates questions grounded in the student's own uploaded materials.
      Uses Gemini-2.5-flash-lite model for cost efficiency.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from pipeline.retriever import retrieve_context, format_context
import json
import os

QUIZ_MODEL = "gemini-2.5-flash-lite"

def generate_quiz(course_id: str, topic: str, faculty: str, num_questions: int = 5) -> list[dict]:
    chunks = retrieve_context(course_id, topic, k=6)
    context = format_context(chunks)

    llm = ChatGoogleGenerativeAI(
        model=QUIZ_MODEL,
        google_api_key=os.environ["GOOGLE_API_KEY"],
        temperature=0.5,
    )

    response = llm.invoke(f"""Based on these course materials:

{context}

Generate {num_questions} multiple-choice questions about: "{topic}"

Return ONLY a JSON array, no markdown, no backticks:
[
  {{
    "question": "question text",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "answer": "A",
    "explanation": "brief explanation"
  }}
]""")

    raw = response.content.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())