from fastapi import APIRouter, Depends, HTTPException
from db.client import get_db
from api.routes.auth import get_current_user
from collections import defaultdict

router = APIRouter()


@router.get("/summary")
def get_progress_summary(current_user=Depends(get_current_user)):
    """
    Returns progress stats across all of the user's courses.
    Must be defined before /{course_id} to avoid 'summary' being
    treated as a course_id parameter.
    """
    db = get_db()
    try:
        courses_result = db.table("courses")\
            .select("*")\
            .eq("user_id", current_user.id)\
            .execute()
        courses = courses_result.data or []

        interactions_result = db.table("topic_interactions")\
            .select("*")\
            .eq("user_id", current_user.id)\
            .execute()
        interactions = interactions_result.data or []

        interactions_by_course = defaultdict(list)
        for interaction in interactions:
            interactions_by_course[interaction["course_id"]].append(interaction)

        course_summaries = []
        for course in courses:
            course_interactions = interactions_by_course.get(course["id"], [])
            topics_covered = len(set(i["topic_tag"] for i in course_interactions))
            course_summaries.append({
                "course_id": course["id"],
                "course_name": course["name"],
                "course_code": course["course_code"],
                "total_interactions": len(course_interactions),
                "topics_covered": topics_covered
            })

        return {
            "total_courses": len(courses),
            "total_interactions": len(interactions),
            "courses": course_summaries
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{course_id}")
def get_course_progress(course_id: str, current_user=Depends(get_current_user)):
    """Returns detailed topic coverage stats for a specific course."""
    db = get_db()
    try:
        course_result = db.table("courses")\
            .select("*")\
            .eq("id", course_id)\
            .eq("user_id", current_user.id)\
            .execute()
        if not course_result.data:
            raise HTTPException(status_code=404, detail="Course not found")

        interactions_result = db.table("topic_interactions")\
            .select("*")\
            .eq("course_id", course_id)\
            .eq("user_id", current_user.id)\
            .execute()
        interactions = interactions_result.data or []

        topics = defaultdict(lambda: {"query_count": 0, "quiz_count": 0})
        for interaction in interactions:
            tag = interaction["topic_tag"]
            if interaction["type"] == "query":
                topics[tag]["query_count"] += 1
            elif interaction["type"] == "quiz":
                topics[tag]["quiz_count"] += 1

        topic_stats = sorted([
            {
                "topic_tag": tag,
                "query_count": stats["query_count"],
                "quiz_count": stats["quiz_count"],
                "total": stats["query_count"] + stats["quiz_count"]
            }
            for tag, stats in topics.items()
        ], key=lambda x: x["total"], reverse=True)

        return {
            "course_id": course_id,
            "total_interactions": len(interactions),
            "topics": topic_stats
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))