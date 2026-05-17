"""
chain.py
--------
WHAT: Combines retrieval + Gemini API call into a single Q&A function.
WHY:  This is the main function the backend calls for every student query.
      It orchestrates: retrieve context → select faculty prompt → call Gemini.

FLOW: question + course_id + faculty → retrieve → build prompt → Gemini → answer
"""

from langchain_google_genai import ChatGoogleGenerativeAI
from pipeline.retriever import retrieve_context, format_context
from prompts.loader import get_prompt
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path='../backend/.env')

# Gemini Pro for Q&A, Gemini Flash for cheaper tasks
QA_MODEL = "gemini-2.5-flash"

def query_course(course_id: str, question: str, faculty: str) -> dict:
    chunks = retrieve_context(course_id, question)
    context = format_context(chunks)
    system_prompt = get_prompt(faculty)

    llm = ChatGoogleGenerativeAI(
        model=QA_MODEL,
        google_api_key=os.environ["GOOGLE_API_KEY"],
        temperature=0.3,
    )

    user_message = f"""Here are the relevant sections from the course materials:

{context}

---

{system_prompt}

Student question: {question}"""

    response = llm.invoke(user_message)

    sources = [
        {"doc_id": c.metadata.get("doc_id"), "page": c.metadata.get("page")}
        for c in chunks
    ]
    return {"answer": response.content, "sources": sources}