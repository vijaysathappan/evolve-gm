"""
Module: enums.py
Purpose: State machine states and type definitions for the Learn Session Engine.
"""

from enum import Enum

class SessionState(str, Enum):
    """Finite State Machine states for a Learning Session."""
    INITIALIZED = "INITIALIZED"
    READY = "READY"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    WAITING_FOR_VALIDATION = "WAITING_FOR_VALIDATION"
    REPLAYING = "REPLAYING"
    COMPLETED = "COMPLETED"
    TERMINATED = "TERMINATED"

class EventType(str, Enum):
    """Types of events that can be recorded on the learning timeline."""
    TEACHER_ACTION = "TEACHER_ACTION"
    STUDENT_ACTION = "STUDENT_ACTION"
    SYSTEM_EVENT = "SYSTEM_EVENT"
    VALIDATION_TRIGGER = "VALIDATION_TRIGGER"

class TeacherActionType(str, Enum):
    """Possible actions a teacher avatar can take."""
    HIGHLIGHT = "HIGHLIGHT"
    DRAW_ARROW = "DRAW_ARROW"
    CIRCLE_FORMULA = "CIRCLE_FORMULA"
    PAUSE = "PAUSE"
    SPEAK = "SPEAK"
    WAIT = "WAIT"
    QUIZ = "QUIZ"
    ANIMATION = "ANIMATION"
    DIAGRAM = "DIAGRAM"
    SUMMARY = "SUMMARY"

class StudentActionType(str, Enum):
    """Possible actions a student can take during a session."""
    PLAY = "PLAY"
    PAUSE = "PAUSE"
    REPLAY = "REPLAY"
    ASK_QUESTION = "ASK_QUESTION"
    ANSWER_QUIZ = "ANSWER_QUIZ"
    TAKE_NOTE = "TAKE_NOTE"
    BOOKMARK = "BOOKMARK"
