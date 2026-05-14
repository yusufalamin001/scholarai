from pydantic import BaseModel
from typing import List


class CourseInput(BaseModel):
    name: str
    code: str


class PlannerRequest(BaseModel):
    courses: List[CourseInput]
    exam_date: str
    target_cgpa: float