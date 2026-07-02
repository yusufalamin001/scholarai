from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from api.routes import auth, courses, documents, query, quiz, progress, rooms, planner

app = FastAPI(
    title="ScholarAI API",
    description="Backend for ScholarAI — AI-powered study assistant",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router,      prefix="/auth",      tags=["Auth"])
app.include_router(courses.router,   prefix="/courses",   tags=["Courses"])
app.include_router(documents.router, prefix="/documents", tags=["Documents"])
app.include_router(query.router,     prefix="/query",     tags=["AI Query"])
app.include_router(quiz.router,      prefix="/quiz",      tags=["Quiz"])
app.include_router(progress.router,  prefix="/progress",  tags=["Progress"])
app.include_router(rooms.router,     prefix="/rooms",     tags=["Study Rooms"])
app.include_router(planner.router,   prefix="/planner",   tags=["Planner"])

@app.on_event("startup")
def warm_up_embedder():
    """
    Load the embedding model once at startup so it's cached in memory
    before any upload. This prevents the model load from happening
    during a request (which can spike memory and cause a restart).
    """
    import sys
    ai_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "ai")
    )
    if ai_dir not in sys.path:
        sys.path.insert(0, ai_dir)
    try:
        from embeddings.config import get_embedder
        get_embedder()  # triggers model download + load once
        print("[STARTUP] Embedding model loaded and ready")
    except Exception as e:
        print(f"[STARTUP] Failed to preload embedding model: {e}")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ScholarAI API"}
