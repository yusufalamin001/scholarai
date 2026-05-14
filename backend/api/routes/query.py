from fastapi import APIRouter, Depends, HTTPException
from db.client import get_db
from api.routes.auth import get_current_user
from models.query import QueryRequest, QueryResponse
import sys
import os

router = APIRouter()


def _get_ai_answer(course_id: str, question: str, faculty: str) -> dict:
    """Imports and calls the AI pipeline chain."""
    ai_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai")
    )
    if ai_dir not in sys.path:
        sys.path.insert(0, ai_dir)

    from pipeline.chain import query_course
    return query_course(course_id, question, faculty)


@router.post("/", response_model=QueryResponse)
def query(body: QueryRequest, current_user=Depends(get_current_user)):
    """
    Runs an AI query against the user's course documents.
    Fetches the course faculty, calls the AI pipeline, logs the interaction,
    and returns the answer with sources.
    """
    db = get_db()

    # Verify course ownership and get faculty
    try:
        result = db.table("courses")\
            .select("*")\
            .eq("id", body.course_id)\
            .eq("user_id", current_user.id)\
            .execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Course not found")
        course = result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Call AI pipeline
    try:
        response = _get_ai_answer(body.course_id, body.question, course["faculty"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI pipeline error: {str(e)}")

    # Log interaction — non-fatal if it fails
    try:
        topic_tag = " ".join(body.question.split()[:5])
        db.table("topic_interactions").insert({
            "user_id": current_user.id,
            "course_id": body.course_id,
            "topic_tag": topic_tag,
            "type": "query"
        }).execute()
    except Exception:
        pass

    return response