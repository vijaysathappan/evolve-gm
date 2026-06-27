# Architecture: Learn Session Models

## Purpose
This document defines the strict data schemas and state machines that govern an active Learning Session.

## State Machine
The core of the Adaptive Learn Session Engine is the `SessionState` Enum. By modeling the session as a strict Finite State Machine (FSM), we guarantee that:
- A session cannot be resumed if it isn't paused.
- A session cannot run without being initialized.
- Validation must clear before progressing.

## Entity Relationships
- **LearningSession**: The root entity.
- **LearningTimeline**: Bound to a session, it maintains a chronological history of `TimelineEvent`s.
- **TeacherAction / StudentAction**: Specific events mapped to the timeline to allow perfect replayability without re-querying the LLM.
- **SessionProgress & SessionMetrics**: Denormalized analytics tables updated by the event bus.

## Design Constraints
- **UUIDs**: All entities use UUIDs to prevent enumeration attacks and support distributed generation.
- **Timezone Awareness**: All timestamps are timezone-aware (UTC) to support global usage.
