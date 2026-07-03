"""
quiz_gen.py
-----------
WHAT: Generates multiple-choice quiz questions from course docs.
WHY:  Active recall (testing yourself) is one of the most effective study methods.
      The AI generates questions grounded in the student's own uploaded materials.
      Uses Gemini-2.5-flash-lite model for cost efficiency.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from pipeline.retriever import retrieve_context, format_context
import json
import re
import os
import logging

logger = logging.getLogger(__name__)

QUIZ_MODEL = "gemini-2.5-flash"


def _extract_json(raw: str) -> list:
    """
    Robustly extract a JSON array from the model's response,
    tolerating markdown fences, leading/trailing prose, etc.
    """
    text = raw.strip()

    # Strip markdown code fences if present
    if "```" in text:
        # Grab content between the first pair of fences
        parts = text.split("```")
        for part in parts:
            candidate = part
            if candidate.strip().startswith("json"):
                candidate = candidate.strip()[4:]
            candidate = candidate.strip()
            if candidate.startswith("["):
                text = candidate
                break

    # Fallback: extract the first [...] block via regex
    if not text.strip().startswith("["):
        match = re.search(r"\[.*\]", text, re.DOTALL)
        if match:
            text = match.group(0)

    return json.loads(text.strip())


def generate_quiz(course_id: str, topic: str, faculty: str, num_questions: int = 5) -> list[dict]:
    chunks = retrieve_context(course_id, topic, k=6)
    context = format_context(chunks)

    if not context.strip():
        raise ValueError(
            "No course materials found for this topic. "
            "Upload documents and wait for them to finish processing before generating a quiz."
        )

    llm = ChatGoogleGenerativeAI(
        model=QUIZ_MODEL,
        google_api_key=os.environ["GOOGLE_API_KEY"],
        temperature=0.5,
    )

    response = llm.invoke(f"""Based on these course materials:

{context}

Generate {num_questions} multiple-choice questions about: "{topic}"

IMPORTANT FORMATTING RULES:
- Use LaTeX notation for ALL mathematical expressions, wrapped in $ for inline and $$ for block
- Examples: $x^2$, $\\int_a^b f(x)dx$, $\\frac{{d}}{{dx}}$, $\\sum_{{i=1}}^n$
- Never write math as plain text like "integral(f(x))" - always use LaTeX
- Never use unicode characters like ∫ or ∑ - use LaTeX instead

Return ONLY a JSON array, no markdown, no backticks:
[
  {{
    "question": "question text with $LaTeX$ for math",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "answer": "A",
    "explanation": "brief explanation"
  }}
]""")

    raw = response.content.strip()
    try:
        return _extract_json(raw)
    except Exception as e:
        logger.error(f"[QUIZ] Failed to parse model output: {e}. Raw response: {raw[:500]}")
        raise ValueError(f"Could not parse quiz from AI response: {e}")
