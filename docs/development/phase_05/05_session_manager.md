# SOFTWARE DEVELOPMENT SPECIFICATION

Module: Adaptive Learn Session Engine
Component: SessionManager
File: backend/app/learning_engine/session_manager.py
Priority: Critical
Estimated Code Size: 700-1200 lines
Python: 3.13

## Objective
Implement a production-grade Session Manager.
The Session Manager is responsible for the complete lifecycle of every learning session.
It is the heart of Learn Mode.
It does NOT call any LLM.
It does NOT retrieve knowledge.
It only orchestrates sessions.

## Responsibilities
The Session Manager MUST support:
• create_session()
• start_session()
• pause_session()
• resume_session()
• stop_session()
• restart_session()
• terminate_session()
• archive_session()
• recover_session()
• restore_session()
• checkpoint_session()
• rollback_checkpoint()
• get_current_state()
• get_timeline()
• next_concept()
• previous_concept()
• complete_concept()
• complete_session()
• update_progress()

## Functional Requirements
- **Session Creation**: Validate inputs, generate UUID/token, initialize timeline/progress/metrics.
- **State Machine**: Support INITIALIZED, READY, RUNNING, PAUSED, WAITING, VALIDATING, REPLAYING, COMPLETED, TERMINATED, FAILED. Raise `InvalidStateTransitionException` on illegal transitions.
- **Checkpoint System**: Every concept completion creates a Checkpoint storing concept, timeline, progress, etc.
- **Thread Safety**: Concurrent users, no singleton state, pure dependency injection.
- **Async**: Every public method must be async. Support cancellation/timeout.
- **Error Handling**: Custom exceptions (`SessionNotFoundException`, etc.).
- **Logging & Metrics**: Structured logging (request_id, session_id, etc.) and metrics tracking.
- **Dependency Injection**: Inject SessionRepository, TimelineEngine, ProgressTracker, ConceptNavigator, EventBus, MetricsCollector, Logger.

## Deliverables
Generate `session_manager.py` ONLY. Production ready, zero placeholders.
