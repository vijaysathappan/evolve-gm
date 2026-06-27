import asyncio
import logging
import time
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import uuid

# Re-using the SessionState from Phase 5 enums
from app.learning_engine.enums import SessionState

# Custom Exceptions for SessionManager
class SessionNotFoundException(Exception):
    pass

class SessionAlreadyRunningException(Exception):
    pass

class SessionAlreadyCompletedException(Exception):
    pass

class InvalidCheckpointException(Exception):
    pass

class InvalidTransitionException(Exception):
    pass

class TimeoutException(Exception):
    pass

class SessionValidationException(Exception):
    pass

# Mock Interfaces for DI (These would normally be in interfaces.py)
class ISessionRepository:
    async def get_session(self, session_id: str) -> Optional[Any]: pass
    async def save_session(self, session: Any) -> None: pass
    async def update_state(self, session_id: str, state: SessionState) -> None: pass

class ITimelineEngine:
    async def initialize_timeline(self, session_id: str) -> None: pass
    async def get_current_position(self, session_id: str) -> int: pass
    async def restore_position(self, session_id: str, position_ms: int) -> None: pass

class IProgressTracker:
    async def initialize_progress(self, session_id: str) -> None: pass
    async def get_progress(self, session_id: str) -> dict: pass
    async def update_progress(self, session_id: str, concepts_completed: int) -> None: pass

class IConceptNavigator:
    async def initialize_navigator(self, session_id: str, chapter_id: str) -> None: pass
    async def get_current_concept(self, session_id: str) -> str: pass
    async def next_concept(self, session_id: str) -> str: pass
    async def previous_concept(self, session_id: str) -> str: pass

class IEventBus:
    async def publish(self, topic: str, event_data: dict) -> None: pass

class IMetricsCollector:
    async def increment(self, metric_name: str, tags: dict = None) -> None: pass
    async def timing(self, metric_name: str, duration_ms: float, tags: dict = None) -> None: pass

# Internal Models (to simulate the schema structs)
class SessionContext:
    def __init__(self, session_id: str, user_id: str, request_id: str):
        self.session_id = session_id
        self.user_id = user_id
        self.request_id = request_id
        self.state = SessionState.INITIALIZED
        self.current_concept: Optional[str] = None

class SessionCheckpoint:
    def __init__(self, session_id: str, concept_id: str, position_ms: int, progress_data: dict):
        self.checkpoint_id = str(uuid.uuid4())
        self.session_id = session_id
        self.concept_id = concept_id
        self.position_ms = position_ms
        self.progress_data = progress_data
        self.timestamp = datetime.now(timezone.utc)

class SessionManager:
    """
    Production-grade Session Manager for the Adaptive Learn Session Engine.
    Follows strictly the State Machine rules, Async concurrency, and Dependency Injection.
    """

    def __init__(
        self,
        repository: ISessionRepository,
        timeline_engine: ITimelineEngine,
        progress_tracker: IProgressTracker,
        concept_navigator: IConceptNavigator,
        event_bus: IEventBus,
        metrics_collector: IMetricsCollector,
        logger: logging.Logger
    ):
        self._repo = repository
        self._timeline = timeline_engine
        self._progress = progress_tracker
        self._navigator = concept_navigator
        self._event_bus = event_bus
        self._metrics = metrics_collector
        self._logger = logger

        # In-memory checkpoint store for this instance (should ideally be in Redis/DB)
        self._checkpoints: Dict[str, List[SessionCheckpoint]] = {}
        # In-memory lock per session to prevent race conditions
        self._locks: Dict[str, asyncio.Lock] = {}

    def _get_lock(self, session_id: str) -> asyncio.Lock:
        if session_id not in self._locks:
            self._locks[session_id] = asyncio.Lock()
        return self._locks[session_id]

    async def _transition_state(self, session: SessionContext, new_state: SessionState) -> None:
        valid_transitions = {
            SessionState.INITIALIZED: [SessionState.READY, SessionState.TERMINATED],
            SessionState.READY: [SessionState.RUNNING, SessionState.TERMINATED],
            SessionState.RUNNING: [SessionState.PAUSED, SessionState.WAITING_FOR_VALIDATION, SessionState.COMPLETED, SessionState.TERMINATED, SessionState.FAILED],
            SessionState.PAUSED: [SessionState.RUNNING, SessionState.TERMINATED, SessionState.REPLAYING],
            SessionState.WAITING_FOR_VALIDATION: [SessionState.RUNNING, SessionState.PAUSED, SessionState.REPLAYING],
            SessionState.REPLAYING: [SessionState.RUNNING, SessionState.PAUSED],
            SessionState.COMPLETED: [SessionState.TERMINATED],
            SessionState.TERMINATED: [],
            SessionState.FAILED: [SessionState.INITIALIZED, SessionState.TERMINATED]
        }
        
        allowed = valid_transitions.get(session.state, [])
        if new_state not in allowed:
            self._logger.error(f"Invalid state transition for {session.session_id}: {session.state} -> {new_state}")
            raise InvalidTransitionException(f"Cannot transition from {session.state} to {new_state}")
            
        old_state = session.state
        session.state = new_state
        await self._repo.update_state(session.session_id, new_state)
        
        await self._event_bus.publish("SESSION_STATE_CHANGED", {
            "session_id": session.session_id,
            "old_state": old_state.value,
            "new_state": new_state.value,
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        self._logger.info(f"Session {session.session_id} transitioned: {old_state} -> {new_state}")

    async def create_session(
        self, 
        user_id: str, 
        chapter_id: str, 
        language: str = "en", 
        teacher_style: str = "socratic"
    ) -> str:
        """
        Creates a new session context, initializes engines.
        """
        start_time = time.time()
        request_id = str(uuid.uuid4())
        
        if not user_id or not chapter_id:
            raise SessionValidationException("user_id and chapter_id are required")
            
        session_id = str(uuid.uuid4())
        session = SessionContext(session_id, user_id, request_id)
        
        try:
            # Initialize sub-engines
            await asyncio.gather(
                self._timeline.initialize_timeline(session_id),
                self._progress.initialize_progress(session_id),
                self._navigator.initialize_navigator(session_id, chapter_id)
            )
            
            await self._repo.save_session(session)
            await self._transition_state(session, SessionState.READY)
            
            self._checkpoints[session_id] = []
            
            await self._metrics.increment("sessions.created", tags={"language": language, "style": teacher_style})
            
            elapsed = (time.time() - start_time) * 1000
            self._logger.info(
                f"Session created. request_id={request_id} session_id={session_id} user_id={user_id} elapsed_ms={elapsed:.2f}"
            )
            return session_id
            
        except Exception as e:
            self._logger.error(f"Session creation failed: {str(e)}")
            await self._metrics.increment("sessions.creation_failed")
            raise

    async def start_session(self, session_id: str) -> None:
        """
        Transitions READY to RUNNING.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            if session.state == SessionState.RUNNING:
                raise SessionAlreadyRunningException()
                
            if session.state == SessionState.COMPLETED:
                raise SessionAlreadyCompletedException()
                
            await self._transition_state(session, SessionState.RUNNING)
            
            current_concept = await self._navigator.get_current_concept(session_id)
            session.current_concept = current_concept
            
            await self._event_bus.publish("SESSION_STARTED", {"session_id": session_id})
            await self._metrics.increment("sessions.started")

    async def pause_session(self, session_id: str) -> None:
        """
        Transitions RUNNING/WAITING to PAUSED.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            await self._transition_state(session, SessionState.PAUSED)
            await self._event_bus.publish("SESSION_PAUSED", {"session_id": session_id})
            await self._metrics.increment("sessions.paused")

    async def resume_session(self, session_id: str) -> None:
        """
        Transitions PAUSED to RUNNING.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            await self._transition_state(session, SessionState.RUNNING)
            await self._event_bus.publish("SESSION_RESUMED", {"session_id": session_id})
            await self._metrics.increment("sessions.resumed")

    async def stop_session(self, session_id: str) -> None:
        """
        Forces session to FAILED or TERMINATED state manually.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            await self._transition_state(session, SessionState.TERMINATED)
            await self._event_bus.publish("SESSION_STOPPED", {"session_id": session_id})

    async def restart_session(self, session_id: str) -> None:
        """
        Restarts a failed session from Initialized.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            if session.state != SessionState.FAILED:
                raise InvalidTransitionException("Can only restart a FAILED session")
                
            await self._transition_state(session, SessionState.INITIALIZED)
            await self._transition_state(session, SessionState.READY)
            await self._metrics.increment("sessions.restarted")

    async def terminate_session(self, session_id: str) -> None:
        """
        Terminal state. Clean up resources.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            await self._transition_state(session, SessionState.TERMINATED)
            if session_id in self._locks:
                del self._locks[session_id]

    async def archive_session(self, session_id: str) -> None:
        """
        Moves session data to cold storage (implementation omitted).
        """
        session = await self._repo.get_session(session_id)
        if not session:
            raise SessionNotFoundException(session_id)
        # Architecture placeholder for archival process.
        await self._event_bus.publish("SESSION_ARCHIVED", {"session_id": session_id})

    async def recover_session(self, session_id: str) -> None:
        """
        Crash recovery process. Restores from last known good state.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            await self._transition_state(session, SessionState.PAUSED)
            await self._metrics.increment("sessions.recovered")

    async def checkpoint_session(self, session_id: str) -> str:
        """
        Takes a snapshot of the current state.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            position = await self._timeline.get_current_position(session_id)
            progress = await self._progress.get_progress(session_id)
            concept = session.current_concept
            
            checkpoint = SessionCheckpoint(session_id, concept, position, progress)
            if session_id not in self._checkpoints:
                self._checkpoints[session_id] = []
            self._checkpoints[session_id].append(checkpoint)
            
            await self._event_bus.publish("CHECKPOINT_CREATED", {"checkpoint_id": checkpoint.checkpoint_id})
            return checkpoint.checkpoint_id

    async def restore_session(self, session_id: str, checkpoint_id: str) -> None:
        """Alias for rollback_checkpoint in this context"""
        await self.rollback_checkpoint(session_id, checkpoint_id)

    async def rollback_checkpoint(self, session_id: str, checkpoint_id: str) -> None:
        """
        Reverts the session to a specific checkpoint.
        """
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            checkpoints = self._checkpoints.get(session_id, [])
            target = next((c for c in checkpoints if c.checkpoint_id == checkpoint_id), None)
            
            if not target:
                raise InvalidCheckpointException(checkpoint_id)
                
            await self._timeline.restore_position(session_id, target.position_ms)
            session.current_concept = target.concept_id
            
            await self._transition_state(session, SessionState.PAUSED)
            await self._event_bus.publish("CHECKPOINT_RESTORED", {"checkpoint_id": checkpoint_id})

    async def get_current_state(self, session_id: str) -> str:
        session = await self._repo.get_session(session_id)
        if not session:
            raise SessionNotFoundException(session_id)
        return session.state.value

    async def get_timeline(self, session_id: str) -> int:
        return await self._timeline.get_current_position(session_id)

    async def next_concept(self, session_id: str) -> str:
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            next_c = await self._navigator.next_concept(session_id)
            session.current_concept = next_c
            await self._event_bus.publish("CONCEPT_CHANGED", {"concept_id": next_c})
            return next_c

    async def previous_concept(self, session_id: str) -> str:
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            prev_c = await self._navigator.previous_concept(session_id)
            session.current_concept = prev_c
            await self._event_bus.publish("CONCEPT_CHANGED", {"concept_id": prev_c})
            return prev_c

    async def complete_concept(self, session_id: str) -> None:
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
            
            await self.checkpoint_session(session_id)
            await self._event_bus.publish("CONCEPT_COMPLETED", {"concept_id": session.current_concept})
            
    async def complete_session(self, session_id: str) -> None:
        async with self._get_lock(session_id):
            session = await self._repo.get_session(session_id)
            if not session:
                raise SessionNotFoundException(session_id)
                
            await self._transition_state(session, SessionState.COMPLETED)
            await self._event_bus.publish("SESSION_COMPLETED", {"session_id": session_id})
            await self._metrics.increment("sessions.completed")

    async def update_progress(self, session_id: str, concepts_completed: int) -> None:
        await self._progress.update_progress(session_id, concepts_completed)
        await self._event_bus.publish("PROGRESS_UPDATED", {"session_id": session_id})

