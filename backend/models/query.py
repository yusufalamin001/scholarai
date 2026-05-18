from pydantic import BaseModel
from typing import List, Any


class QueryRequest(BaseModel):
    course_id: str
    question: str


class QueryResponse(BaseModel):
    answer: str
    sources: List[Any]