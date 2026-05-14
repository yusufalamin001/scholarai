from fastapi import APIRouter, Depends, HTTPException
from api.routes.auth import get_current_user
from models.planner import PlannerRequest
import sys
import os

router = APIRouter()


@router.post("/generate")
def generate_plan(body: PlannerRequest, current_user=Depends(get_current_user)):
    """
    Generates a weekly study schedule using Gemini.
    Takes a list of courses, exam date, and target CGPA.
    Returns a structured weekly calendar with daily sessions and study tips.
    """
    try:
        ai_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai")
        )
        if ai_dir not in sys.path:
            sys.path.insert(0, ai_dir)

        from pipeline.planner_ai import generate_study_plan  # type: ignore

        plan = generate_study_plan(
            courses=[c.model_dump() for c in body.courses],
            exam_date=body.exam_date,
            target_cgpa=body.target_cgpa
        )
        return plan

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Planner error: {str(e)}")