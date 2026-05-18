from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class DocumentResponse(BaseModel):
    id: UUID
    course_id: UUID
    user_id: UUID
    name: str
    storage_path: str
    size_bytes: int
    status: str
    created_at: datetime