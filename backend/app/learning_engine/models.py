"""
Module: models.py
Purpose: SQLAlchemy 2.0 representations of Learning Session state and timeline.
"""

from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.database.base import Base
from app.learning_engine.enums import SessionState, EventType, TeacherActionType, StudentActionType

def generate_uuid():
    return str(uuid.uuid4())

class LearningSession(Base):
    __tablename__ = "learning_sessions"
    
    session_id = Column(String, primary_key=True, default=generate_uuid)
    student_id = Column(String, index=True, nullable=False)
    chapter_id = Column(String, nullable=False)
    state = Column(Enum(SessionState), default=SessionState.INITIALIZED)
    
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    timeline_events = relationship("TimelineEvent", back_populates="session", cascade="all, delete-orphan")
    progress = relationship("SessionProgress", back_populates="session", uselist=False, cascade="all, delete-orphan")
    metrics = relationship("SessionMetrics", back_populates="session", uselist=False, cascade="all, delete-orphan")
    summary = relationship("SessionSummary", back_populates="session", uselist=False, cascade="all, delete-orphan")

class LearningConcept(Base):
    __tablename__ = "learning_concepts"
    # Links to the Knowledge Base
    concept_id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(Text)

class LearningTimeline(Base):
    # Represents a playback timeline structure logically, tied to the session.
    # Usually we can represent this purely through chronological TimelineEvents.
    __tablename__ = "learning_timelines"
    timeline_id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("learning_sessions.session_id"))
    duration_seconds = Column(Integer, default=0)
    current_position_ms = Column(Integer, default=0)

class TimelineEvent(Base):
    __tablename__ = "timeline_events"
    
    event_id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("learning_sessions.session_id"), nullable=False)
    timestamp_ms = Column(Integer, nullable=False) # Timeline playback position
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    event_type = Column(Enum(EventType), nullable=False)
    payload = Column(Text) # JSON string containing event specifics
    
    session = relationship("LearningSession", back_populates="timeline_events")

class TeacherAction(Base):
    __tablename__ = "teacher_actions"
    action_id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey("timeline_events.event_id"))
    action_type = Column(Enum(TeacherActionType), nullable=False)
    target_element = Column(String) # UI element ID if applicable
    content = Column(Text)

class StudentAction(Base):
    __tablename__ = "student_actions"
    action_id = Column(String, primary_key=True, default=generate_uuid)
    event_id = Column(String, ForeignKey("timeline_events.event_id"))
    action_type = Column(Enum(StudentActionType), nullable=False)
    context = Column(Text)

class SessionBookmark(Base):
    __tablename__ = "session_bookmarks"
    bookmark_id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("learning_sessions.session_id"))
    timestamp_ms = Column(Integer, nullable=False)
    title = Column(String)
    content_ref = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class TeacherNote(Base):
    __tablename__ = "teacher_notes"
    note_id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("learning_sessions.session_id"))
    timestamp_ms = Column(Integer, nullable=False)
    note_content = Column(Text)

class SessionProgress(Base):
    __tablename__ = "session_progress"
    progress_id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("learning_sessions.session_id"))
    concepts_completed = Column(Integer, default=0)
    mastery_estimate = Column(Float, default=0.0)
    
    session = relationship("LearningSession", back_populates="progress")

class SessionMetrics(Base):
    __tablename__ = "session_metrics"
    metrics_id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("learning_sessions.session_id"))
    elapsed_time_sec = Column(Integer, default=0)
    idle_time_sec = Column(Integer, default=0)
    replay_count = Column(Integer, default=0)
    
    session = relationship("LearningSession", back_populates="metrics")

class ValidationCheckpoint(Base):
    __tablename__ = "validation_checkpoints"
    checkpoint_id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("learning_sessions.session_id"))
    concept_id = Column(String)
    timestamp_ms = Column(Integer, nullable=False)
    passed = Column(Boolean, default=False)
    validation_score = Column(Float)

class SessionSummary(Base):
    __tablename__ = "session_summaries"
    summary_id = Column(String, primary_key=True, default=generate_uuid)
    session_id = Column(String, ForeignKey("learning_sessions.session_id"))
    understanding_delta = Column(Float, default=0.0)
    generated_report = Column(Text)
    
    session = relationship("LearningSession", back_populates="summary")
