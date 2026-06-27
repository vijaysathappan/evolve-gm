# SOFTWARE DESIGN SPECIFICATION

Module: Adaptive Learn Session Engine
Sprint: 02 (Session Models)
Version: 1.0

## Objective
Represent every learning session as a finite state machine and define the strict data models for the Learning Engine.

## State Machine
The session must support the following states:
`INITIALIZED` -> `READY` -> `RUNNING` -> `PAUSED` -> `WAITING_FOR_VALIDATION` -> `REPLAYING` -> `COMPLETED` -> `TERMINATED`
These will be represented using Enums.

## Required Models
Create SQLAlchemy and Pydantic representations for:
- LearningSession
- LearningTimeline
- LearningConcept
- TimelineEvent
- TeacherAction
- StudentAction
- SessionBookmark
- TeacherNote
- SessionProgress
- SessionMetrics
- ValidationCheckpoint
- SessionSummary

## Constraints
- Every model must be fully documented.
- Use SQLAlchemy 2.0 and Pydantic v2.
- Use UUIDs for primary keys.
- Use timezone-aware datetime.
- No APIs, no repositories.
- Generate only `models.py`, `schemas.py`, and `enums.py`.
