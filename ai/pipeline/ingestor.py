"""
ingestor.py
-----------
WHAT: Takes a PDF file and loads it into the ChromaDB vector store.
WHY:  Once a document is ingested, any query against that course can
      find relevant passages using vector similarity search.

FLOW: PDF file → extract text → split into chunks → embed → store in ChromaDB
"""

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from embeddings.config import get_embedder
import os

CHROMA_PATH = os.getenv("CHROMA_PERSIST_PATH", "./chroma_store")

# Chunk settings — tuned for academic text
# 1000 chars ≈ 150-200 words, roughly one concept per chunk
# 200 char overlap prevents losing context at chunk boundaries
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", ".", " "],
)


def ingest_document(course_id: str, pdf_path: str, doc_id: str) -> int:
    """
    Ingests a PDF into the ChromaDB collection for a given course.

    Args:
        course_id: The unique ID of the course (used as collection name)
        pdf_path:  Local path to the PDF file
        doc_id:    Unique ID of the document (stored as metadata)

    Returns:
        Number of chunks stored

    Usage (called by backend after file is saved to Supabase Storage):
        count = ingest_document("course_abc123", "/tmp/notes.pdf", "doc_xyz")
    """
    # 1. Load PDF — LangChain handles the parsing
    loader = PyPDFLoader(pdf_path)
    pages = loader.load()

    # 2. Split into chunks
    chunks = text_splitter.split_documents(pages)

    # 3. Tag each chunk with metadata so we can filter later
    for chunk in chunks:
        chunk.metadata["course_id"] = course_id
        chunk.metadata["doc_id"] = doc_id

    # 4. Embed and store — Chroma.from_documents does both in one call
    # Each course gets its own named collection in ChromaDB
    Chroma.from_documents(
        documents=chunks,
        embedding=get_embedder(),
        collection_name=f"course_{course_id}",
        persist_directory=CHROMA_PATH,
    )

    return len(chunks)


def delete_document(course_id: str, doc_id: str) -> None:
    """
    Removes all chunks belonging to a specific document from ChromaDB.
    Called when a student deletes a document from a course.
    """
    from chromadb import PersistentClient
    client = PersistentClient(path=CHROMA_PATH)
    collection = client.get_collection(f"course_{course_id}")
    collection.delete(where={"doc_id": doc_id})
