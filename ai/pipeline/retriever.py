"""
retriever.py
------------
WHAT: Given a course and a question, finds the most relevant document chunks.
WHY:  This is the "R" in RAG. We don't send entire documents to Claude —
      we only send the 5 most relevant paragraphs. This keeps costs low
      and answers accurate.

FLOW: question text → embed question → similarity search ChromaDB → return chunks
"""

from langchain_community.vectorstores import Chroma
from langchain.schema import Document
from embeddings.config import get_embedder
from typing import List
import os

CHROMA_PATH = os.getenv("CHROMA_PERSIST_PATH", "./chroma_store")


def retrieve_context(course_id: str, question: str, k: int = 5) -> List[Document]:
    """
    Retrieves the k most relevant document chunks for a given question
    within a specific course's ChromaDB collection.

    Args:
        course_id: Scopes the search to this course only
        question:  The student's question (converted to a vector internally)
        k:         Number of chunks to return (default 5)

    Returns:
        List of LangChain Document objects with .page_content and .metadata

    Usage:
        chunks = retrieve_context("course_abc123", "What is KVL?")
        context = "\\n\\n".join([c.page_content for c in chunks])
    """
    vectorstore = Chroma(
        collection_name=f"course_{course_id}",
        embedding_function=get_embedder(),
        persist_directory=CHROMA_PATH,
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": k})
    return retriever.invoke(question)


def format_context(chunks: List[Document]) -> str:
    """
    Joins retrieved chunks into a single context string for the prompt.
    Adds source metadata so the AI can reference which document it's from.
    """
    parts = []
    for i, chunk in enumerate(chunks, 1):
        doc_id = chunk.metadata.get("doc_id", "unknown")
        page = chunk.metadata.get("page", "?")
        parts.append(f"[Source {i} — Document: {doc_id}, Page: {page}]\n{chunk.page_content}")
    return "\n\n---\n\n".join(parts)
