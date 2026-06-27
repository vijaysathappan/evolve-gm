"""
Module: schemas.py
Purpose: Pydantic v2 schemas for the Adaptive Learn Session Engine.
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any
from datetime import datetime
from uuid import UUID

from app.learning_engine.enums import SessionState, EventType, TeacherActionType, StudentActionType

class LearningSessionBase(BaseModel):
    student_id: str = Field(..., description="ID of the student")
    chapter_id: str = Field(..., description="ID of the chapter being learned")

class LearningSessionCreate(LearningSessionBase):
    pass

class LearningSessionResponse(LearningSessionBase):
    session_id: str
    state: SessionState
    start_time: datetime
    end_time: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

class TimelineEventBase(BaseModel):
    timestamp_ms: int = Field(..., description="Playback position in milliseconds")
    event_type: EventType
    payload: Optional[str] = Field(None, description="Serialized event data")

class TimelineEventCreate(TimelineEventBase):
    session_id: str

class TimelineEventResponse(TimelineEventBase):
    event_id: str
    session_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TeacherActionBase(BaseModel):
    action_type: TeacherActionType
    target_element: Optional[str] = None
    content: Optional[str] = None

class TeacherActionResponse(TeacherActionBase):
    action_id: str
    event_id: str

    model_config = ConfigDict(from_attributes=True)

class StudentActionBase(BaseModel):
    action_type: StudentActionType
    context: Optional[str] = None

class StudentActionResponse(StudentActionBase):
    action_id: str
    event_id: str

    model_config = ConfigDict(from_attributes=True)

class SessionBookmarkBase(BaseModel):
    timestamp_ms: int
    title: str
    content_ref: Optional[str] = None

class SessionBookmarkResponse(SessionBookmarkBase):
    bookmark_id: str
    session_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TeacherNoteBase(BaseModel):
    timestamp_ms: int
    note_content: str

class TeacherNoteResponse(TeacherNoteBase):
    note_id: str
    session_id: str

    model_config = ConfigDict(from_attributes=True)

class SessionProgressResponse(BaseModel):
    progress_id: str
    session_id: str
    concepts_completed: int
    mastery_estimate: float

    model_config = ConfigDict(from_attributes=True)

class SessionMetricsResponse(BaseModel):
    metrics_id: str
    session_id: str
    elapsed_time_sec: int
    idle_time_sec: int
    replay_count: int

    model_config = ConfigDict(from_attributes=True)

class ValidationCheckpointBase(BaseModel):
    concept_id: str
    timestamp_ms: int
    passed: bool
    validation_score: Optional[float] = None

class ValidationCheckpointResponse(ValidationCheckpointBase):
    checkpoint_id: str
    session_id: str

    model_config = ConfigDict(from_attributes=True)
