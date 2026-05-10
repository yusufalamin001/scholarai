"""
summarizer.py
-------------
WHAT: Generates a structured summary of all documents in a course.
WHY:  Students can quickly revise key topics without re-reading full notes.
      Uses Gemini flash (cheaper model) since summarisation needs less reasoning.
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from pipeline.retriever import retrieve_context, format_context
from prompts.loader import get_prompt
import os

SUMMARY_MODEL = "gemini-2.5-flash-lite"  # cheaper for summaries

def summarize_topic(course_id: str, topic: str, faculty: str) -> str:
    chunks = retrieve_context(course_id, topic, k=8)
    context = format_context(chunks)
    system_prompt = get_prompt(faculty)

    llm = ChatGoogleGenerativeAI(
        model=SUMMARY_MODEL,
        google_api_key=os.environ["GOOGLE_API_KEY"],
        temperature=0.3,
    )

    response = llm.invoke(f"""{system_prompt}

Based on these course materials:
{context}

Generate a clear, structured summary of: "{topic}"

Format with:
- Key definitions
- Main concepts
- Important formulas or rules (if applicable)
- A 2-sentence recap at the end""")

    return response.content