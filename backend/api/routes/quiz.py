from fastapi import APIRouter, Depends, HTTPException
from db.client import get_db
from api.routes.auth import get_current_user
from models.quiz import QuizGenerateRequest, QuizSubmitRequest, QuizSubmitResponse
import sys
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def _generate_quiz(course_id: str, topic: str, faculty: str, num_questions: int) -> list:
    """Imports and calls the AI quiz generator."""
    ai_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai")
    )
    if ai_dir not in sys.path:
        sys.path.insert(0, ai_dir)

    from pipeline.quiz_gen import generate_quiz  # type: ignore
    return generate_quiz(course_id, topic, faculty, num_questions)


@router.post("/generate")
def generate_quiz(body: QuizGenerateRequest, current_user=Depends(get_current_user)):
    """
    Generates MCQ questions for a given course and topic.
    Returns a list of questions with options, correct answer, and explanation.
    """
    db = get_db()

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

    try:
        questions = _generate_quiz(
            body.course_id,
            body.topic,
            course["faculty"],
            body.num_questions
        )
    except Exception as e:
        logger.error(f"[QUIZ] Generation failed: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")

    return {
        "topic": body.topic,
        "total": len(questions),
        "questions": questions
    }


@router.post("/submit", response_model=QuizSubmitResponse)
def submit_quiz(body: QuizSubmitRequest, current_user=Depends(get_current_user)):
    """
    Receives a completed quiz score, logs it to topic_interactions,
    and returns the result with a percentage and feedback message.
    """
    db = get_db()

    percentage = round((body.score / body.total) * 100, 1) if body.total > 0 else 0.0

    if percentage >= 80:
        message = "Excellent work!"
    elif percentage >= 60:
        message = "Good job, keep practising!"
    else:
        message = "Keep studying, you'll get there!"

    try:
        db.table("topic_interactions").insert({
            "user_id": current_user.id,
            "course_id": body.course_id,
            "topic_tag": body.topic,
            "type": "quiz"
        }).execute()
    except Exception:
        pass  # Non-fatal — don't fail submission if logging fails

    return QuizSubmitResponse(
        score=body.score,
        total=body.total,
        percentage=percentage,
        message=message
    )