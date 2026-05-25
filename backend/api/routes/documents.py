from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from db.client import get_db
from api.routes.auth import get_current_user
from models.document import DocumentResponse
from typing import List
import tempfile
import os
import sys
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _verify_course_ownership(db, course_id: str, user_id: str):
    """Raises 404 if course doesn't exist or doesn't belong to user."""
    result = db.table("courses")\
        .select("id")\
        .eq("id", course_id)\
        .eq("user_id", user_id)\
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found")


@router.post("/{course_id}/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    course_id: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    """Uploads a PDF, stores it, and runs AI ingestion synchronously."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    db = get_db()
    _verify_course_ownership(db, course_id, current_user.id)

    content = await file.read()
    size_bytes = len(content)
    doc_id = str(uuid.uuid4())
    storage_path = f"{current_user.id}/{course_id}/{doc_id}.pdf"

    try:
        db.storage.from_("course-documents").upload(
            path=storage_path,
            file=content,
            file_options={"content-type": "application/pdf", "upsert": "false"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    try:
        result = db.table("documents").insert({
            "id": doc_id,
            "course_id": course_id,
            "user_id": current_user.id,
            "name": file.filename,
            "storage_path": storage_path,
            "size_bytes": size_bytes,
            "status": "processing"
        }).execute()
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to record document")
        document = result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    temp_path = os.path.join(tempfile.gettempdir(), f"{doc_id}.pdf")
    with open(temp_path, "wb") as f:
        f.write(content)

    try:
        ai_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai")
        )
        if ai_dir not in sys.path:
            sys.path.insert(0, ai_dir)

        from pipeline.ingestor import ingest_document
        logger.info(f"[INGESTOR] Starting ingestion for doc {doc_id}")
        ingest_document(course_id, temp_path, doc_id)
        logger.info(f"[INGESTOR] Ingestion complete for doc {doc_id}")
        db.table("documents").update({"status": "ready"}).eq("id", doc_id).execute()
        document["status"] = "ready"
    except Exception as e:
        logger.error(f"[INGESTOR] Failed for doc {doc_id}: {str(e)}", exc_info=True)
        db.table("documents").update({"status": "error"}).eq("id", doc_id).execute()
        document["status"] = "error"
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

    return document


@router.get("/{course_id}", response_model=List[DocumentResponse])
def list_documents(course_id: str, current_user=Depends(get_current_user)):
    """Lists all documents for a course."""
    db = get_db()
    _verify_course_ownership(db, course_id, current_user.id)

    try:
        result = db.table("documents")\
            .select("*")\
            .eq("course_id", course_id)\
            .order("created_at", desc=True)\
            .execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{doc_id}", status_code=204)
def delete_document(doc_id: str, current_user=Depends(get_current_user)):
    """Deletes a document from Storage, the vector store, and the database."""
    db = get_db()

    try:
        result = db.table("documents")\
            .select("*")\
            .eq("id", doc_id)\
            .eq("user_id", current_user.id)\
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Document not found")
        document = result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Delete from Supabase Storage
    try:
        db.storage.from_("course-documents").remove([document["storage_path"]])
    except Exception:
        pass  # Non-fatal — continue to DB deletion

    # Delete chunks from Supabase vector store
    try:
        ai_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai")
        )
        if ai_dir not in sys.path:
            sys.path.insert(0, ai_dir)

        from pipeline.ingestor import delete_document as delete_chunks
        delete_chunks(document["course_id"], doc_id)
    except Exception:
        pass  # Best-effort

    # Delete from database
    try:
        db.table("documents").delete().eq("id", doc_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return None