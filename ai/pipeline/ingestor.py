"""
ingestor.py
-----------
WHAT: Takes a PDF file and loads it into Supabase pgvector store.
WHY:  Once a document is ingested, any query against that course can
      find relevant passages using vector similarity search.

FLOW: PDF file → extract text → split into chunks → embed → store in Supabase
"""

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from embeddings.config import get_embedder
from supabase import create_client
import os

# Chunk settings — tuned for academic text
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", " "],
)


def _get_supabase():
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )


def ingest_document(course_id: str, pdf_path: str, doc_id: str) -> int:
    """
    Ingests a PDF into the Supabase pgvector store for a given course.

    Args:
        course_id: The unique ID of the course
        pdf_path:  Local path to the PDF file
        doc_id:    Unique ID of the document (stored for later deletion)

    Returns:
        Number of chunks stored
    """
    # 1. Load and split the PDF
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()
    chunks = text_splitter.split_documents(pages)

    if not chunks:
        return 0

    # 2. Embed all chunk texts
    embedder = get_embedder()
    texts = [chunk.page_content for chunk in chunks]
    embeddings = embedder.embed_documents(texts)

    # 3. Build rows for Supabase
    rows = []
    for chunk, embedding in zip(chunks, embeddings):
        rows.append({
            "course_id": course_id,
            "doc_id": doc_id,
            "content": chunk.page_content,
            "metadata": {
                "page": chunk.metadata.get("page", 0),
                "doc_id": doc_id,
            },
            "embedding": embedding,
        })

    # 4. Insert into Supabase
    db = _get_supabase()
    db.table("document_chunks").insert(rows).execute()

    return len(chunks)


def delete_document(course_id: str, doc_id: str) -> None:
    """Removes all chunks belonging to a specific document."""
    db = _get_supabase()
    db.table("document_chunks").delete().eq("doc_id", doc_id).execute()