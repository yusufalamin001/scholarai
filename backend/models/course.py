from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class CourseCreate(BaseModel):
    name: str
    course_code: str
    faculty: str


class CourseResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    course_code: str
    faculty: str
    created_at: datetime