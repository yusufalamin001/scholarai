from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from db.client import get_db
from jose import jwt, JWTError
import httpx
import os

security = HTTPBearer()
router = APIRouter()

_jwks_cache = None

def get_jwks():
    """Fetches JWKS from Supabase once and caches it for the lifetime of the app."""
    global _jwks_cache
    if _jwks_cache is None:
        url = f"{os.environ['SUPABASE_URL']}/auth/v1/.well-known/jwks.json"
        response = httpx.get(url, timeout=10.0)
        response.raise_for_status()
        _jwks_cache = response.json()
    return _jwks_cache


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")

        jwks = get_jwks()
        key = next((k for k in jwks["keys"] if k["kid"] == kid), None)
        if not key:
            raise HTTPException(status_code=401, detail="Signing key not found")

        payload = jwt.decode(
            token,
            key,
            algorithms=["ES256"],
            audience="authenticated"
        )

        class User:
            def __init__(self, id, email):
                self.id = id
                self.email = email

        return User(id=payload["sub"], email=payload.get("email"))

    except JWTError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))

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

    allowed_fields = ["faculty", "full_name", "university", "onboarding_complete", "avatar_url"]
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