from fastapi import APIRouter, Depends, HTTPException, Header
from db.client import get_db
from typing import Optional
import os

router = APIRouter()


def get_current_user(authorization: Optional[str] = Header(None)):
    """
    Validates the Supabase JWT token from the Authorization header.
    Every protected endpoint calls this as a dependency.
    Returns the user's ID if the token is valid, raises 401 if not.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Missing or invalid authorization header"
        )

    token = authorization.replace("Bearer ", "")
    db = get_db()

    try:
        user = db.auth.get_user(token)
        return user.user
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


@router.get("/me")
def get_current_user_profile(current_user=Depends(get_current_user)):
    """
    Returns the current user's profile from the profiles table.
    Called by the frontend after login to get faculty, name, university.
    """
    db = get_db()

    try:
        profile = db.table("profiles")\
            .select("*")\
            .eq("id", current_user.id)\
            .single()\
            .execute()

        if not profile.data:
            raise HTTPException(
                status_code=404,
                detail="Profile not found"
            )

        return {
            "id": current_user.id,
            "email": current_user.email,
            "profile": profile.data
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/profile")
def update_profile(
    body: dict,
    current_user=Depends(get_current_user)
):
    """
    Updates the current user's profile.
    Used by the Complete Profile page (first Google login)
    and the Settings page.

    Body: { "faculty": "engineering", "full_name": "Yusuf", 
            "university": "Lagos State University" }
    """
    db = get_db()

    allowed_fields = ["faculty", "full_name", "university"]
    update_data = {
        k: v for k, v in body.items()
        if k in allowed_fields and v is not None
    }

    if not update_data:
        raise HTTPException(
            status_code=400,
            detail="No valid fields provided to update"
        )

    try:
        result = db.table("profiles")\
            .update(update_data)\
            .eq("id", current_user.id)\
            .execute()

        return {"message": "Profile updated", "profile": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/preferences")
def update_preferences(
    body: dict,
    current_user=Depends(get_current_user)
):
    """
    Creates or updates user preferences (theme, font size etc).
    Called by the Settings page when the user changes appearance.

    Body: { "theme": "dark", "font_size": "medium", "compact": false }
    """
    db = get_db()

    allowed_fields = ["theme", "font_size", "compact"]
    upsert_data = {
        k: v for k, v in body.items()
        if k in allowed_fields and v is not None
    }
    upsert_data["user_id"] = current_user.id

    try:
        result = db.table("user_preferences")\
            .upsert(upsert_data)\
            .execute()

        return {"message": "Preferences updated", "preferences": result.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))