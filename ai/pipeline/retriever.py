"""
retriever.py
------------
WHAT: Given a course and a question, finds the most relevant document chunks.
WHY:  This is the "R" in RAG. We only send the most relevant passages to
      the AI, keeping costs low and answers accurate.

FLOW: question text → embed question → similarity search Supabase → return chunks
"""

from embeddings.config import get_embedder
from supabase import create_client
from typing import List
import os


class Chunk:
    """Lightweight chunk object with page_content and metadata."""
    def __init__(self, content: str, metadata: dict):
        self.page_content = content
        self.metadata = metadata


def _get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def retrieve_context(course_id: str, question: str, k: int = 5) -> List[Chunk]:
    """
    Retrieves the k most relevant document chunks for a question
    within a specific course, using Supabase pgvector similarity search.
    """
    # 1. Embed the question
    embedder = get_embedder()
    query_embedding = embedder.embed_query(question)

    # 2. Call the Supabase match function
    db = _get_supabase()
    result = db.rpc(
        "match_document_chunks",
        {
            "query_embedding": query_embedding,
            "filter_course_id": course_id,
            "match_count": k,
        },
    ).execute()

    # 3. Convert rows to Chunk objects
    chunks = []
    for row in (result.data or []):
        chunks.append(Chunk(
            content=row["content"],
            metadata=row.get("metadata", {}),
        ))
    return chunks


def format_context(chunks: List[Chunk]) -> str:
    """
    Joins retrieved chunks into a single context string for the prompt.
    """
    parts = []
    for i, chunk in enumerate(chunks, 1):
        doc_id = chunk.metadata.get("doc_id", "unknown")
        page = chunk.metadata.get("page", "?")
        parts.append(f"[Source {i} — Document: {doc_id}, Page: {page}]\n{chunk.page_content}")
    return "\n\n---\n\n".join(parts)