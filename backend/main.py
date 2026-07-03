from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging
import os

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

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

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ScholarAI API"}
