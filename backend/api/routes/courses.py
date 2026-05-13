from fastapi import APIRouter, Depends, HTTPException
from db.client import get_db
from api.routes.auth import get_current_user
from models.course import CourseCreate, CourseResponse
from typing import List

router = APIRouter()


@router.get("/", response_model=List[CourseResponse])
def list_courses(current_user=Depends(get_current_user)):
    """Returns all courses belonging to the current user."""
    db = get_db()
    try:
        result = db.table("courses")\
            .select("*")\
            .eq("user_id", current_user.id)\
            .order("created_at", desc=True)\
            .execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/", response_model=CourseResponse, status_code=201)
def create_course(body: CourseCreate, current_user=Depends(get_current_user)):
    """Creates a new course for the current user."""
    db = get_db()
    try:
        data = {
            "user_id": str(current_user.id),
            "name": body.name,
            "course_code": body.course_code,
            "faculty": body.faculty,
        }
        result = db.table("courses").insert(data).execute()
        if not result.data:
            raise HTTPException(status_code=400, detail="Failed to create course")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}")
def get_course(course_id: str, current_user=Depends(get_current_user)):
    """Returns a single course with its documents."""
    db = get_db()
    try:
        course_result = db.table("courses")\
            .select("*")\
            .eq("id", course_id)\
            .eq("user_id", current_user.id)\
            .execute()
        if not course_result.data:
            raise HTTPException(status_code=404, detail="Course not found")

        documents_result = db.table("documents")\
            .select("*")\
            .eq("course_id", course_id)\
            .execute()

        return {
            **course_result.data[0],
            "documents": documents_result.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{course_id}", status_code=204)
def delete_course(course_id: str, current_user=Depends(get_current_user)):
    """
    Deletes a course and its documents.
    ChromaDB collection deletion handled in feature/backend-documents.
    """
    db = get_db()
    try:
        course_result = db.table("courses")\
            .select("id")\
            .eq("id", course_id)\
            .eq("user_id", current_user.id)\
            .execute()
        if not course_result.data:
            raise HTTPException(status_code=404, detail="Course not found")

        db.table("documents").delete().eq("course_id", course_id).execute()

        # TODO: Delete ChromaDB collection course_{course_id}
        # Will be wired in feature/backend-documents

        db.table("courses").delete().eq("id", course_id).execute()
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))