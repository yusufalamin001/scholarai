from pydantic import BaseModel


class QuizGenerateRequest(BaseModel):
    course_id: str
    topic: str
    num_questions: int = 5


class QuizSubmitRequest(BaseModel):
    course_id: str
    topic: str
    score: int
    total: int


class QuizSubmitResponse(BaseModel):
    score: int
    total: int
    percentage: float
    message: str