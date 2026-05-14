from fastapi import APIRouter, Depends, HTTPException
from db.client import get_db
from api.routes.auth import get_current_user
from models.room import RoomCreate, RoomJoin, RoomResponse
from typing import List
import secrets
import string
import sys
import os

router = APIRouter()


def _generate_invite_code(length: int = 8) -> str:
    """Generates a random alphanumeric invite code."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _is_room_member(db, room_id: str, user_id: str) -> bool:
    """Returns True if the user is a member of the room."""
    result = db.table("room_members")\
        .select("room_id")\
        .eq("room_id", room_id)\
        .eq("user_id", user_id)\
        .execute()
    return bool(result.data)


@router.post("/", response_model=RoomResponse, status_code=201)
def create_room(body: RoomCreate, current_user=Depends(get_current_user)):
    """Creates a study room and adds the creator as first member."""
    db = get_db()

    try:
        course_result = db.table("courses")\
            .select("id")\
            .eq("id", body.course_id)\
            .eq("user_id", current_user.id)\
            .execute()
        if not course_result.data:
            raise HTTPException(status_code=404, detail="Course not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        room_result = db.table("study_rooms").insert({
            "course_id": body.course_id,
            "created_by": current_user.id,
            "name": body.name,
            "invite_code": _generate_invite_code()
        }).execute()

        if not room_result.data:
            raise HTTPException(status_code=500, detail="Failed to create room")

        room = room_result.data[0]

        db.table("room_members").insert({
            "room_id": room["id"],
            "user_id": current_user.id
        }).execute()

        return room

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[RoomResponse])
def list_rooms(current_user=Depends(get_current_user)):
    """Returns all rooms the current user is a member of."""
    db = get_db()
    try:
        members_result = db.table("room_members")\
            .select("room_id")\
            .eq("user_id", current_user.id)\
            .execute()

        room_ids = [m["room_id"] for m in (members_result.data or [])]
        if not room_ids:
            return []

        rooms_result = db.table("study_rooms")\
            .select("*")\
            .in_("id", room_ids)\
            .order("created_at", desc=True)\
            .execute()

        return rooms_result.data or []

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{room_id}/join")
def join_room(room_id: str, body: RoomJoin, current_user=Depends(get_current_user)):
    """Joins a room using an invite code."""
    db = get_db()
    try:
        room_result = db.table("study_rooms")\
            .select("*")\
            .eq("id", room_id)\
            .eq("invite_code", body.invite_code)\
            .execute()

        if not room_result.data:
            raise HTTPException(
                status_code=404,
                detail="Room not found or invalid invite code"
            )

        if _is_room_member(db, room_id, current_user.id):
            raise HTTPException(status_code=400, detail="Already a member of this room")

        db.table("room_members").insert({
            "room_id": room_id,
            "user_id": current_user.id
        }).execute()

        return {"message": "Joined room successfully", "room": room_result.data[0]}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{room_id}", status_code=204)
def delete_room(room_id: str, current_user=Depends(get_current_user)):
    """Deletes a room. Only the creator can delete it."""
    db = get_db()
    try:
        room_result = db.table("study_rooms")\
            .select("id")\
            .eq("id", room_id)\
            .eq("created_by", current_user.id)\
            .execute()

        if not room_result.data:
            raise HTTPException(
                status_code=404,
                detail="Room not found or you are not the creator"
            )

        db.table("room_members").delete().eq("room_id", room_id).execute()
        db.table("study_rooms").delete().eq("id", room_id).execute()
        return None

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{room_id}/query")
def query_room(room_id: str, body: dict, current_user=Depends(get_current_user)):
    """AI query scoped to the room's course documents."""
    db = get_db()

    question = body.get("question")
    if not question:
        raise HTTPException(status_code=400, detail="question is required")

    try:
        if not _is_room_member(db, room_id, current_user.id):
            raise HTTPException(status_code=403, detail="You are not a member of this room")

        room_result = db.table("study_rooms")\
            .select("*")\
            .eq("id", room_id)\
            .execute()
        if not room_result.data:
            raise HTTPException(status_code=404, detail="Room not found")

        room = room_result.data[0]

        course_result = db.table("courses")\
            .select("*")\
            .eq("id", room["course_id"])\
            .execute()
        if not course_result.data:
            raise HTTPException(status_code=404, detail="Course not found")

        course = course_result.data[0]

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    try:
        ai_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "ai")
        )
        if ai_dir not in sys.path:
            sys.path.insert(0, ai_dir)

        from pipeline.chain import query_course  # type: ignore
        return query_course(room["course_id"], question, course["faculty"])

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI pipeline error: {str(e)}")