from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class RoomCreate(BaseModel):
    name: str
    course_id: str


class RoomJoin(BaseModel):
    invite_code: str


class RoomResponse(BaseModel):
    id: UUID
    course_id: UUID
    created_by: UUID
    name: str
    invite_code: str
    created_at: datetime