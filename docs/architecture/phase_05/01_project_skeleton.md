# Architecture: Adaptive Learn Session Engine

## Purpose
The Adaptive Learn Session Engine is the grand orchestrator of EvolveGM's learning experience. It coordinates the complex interactions between the Student Cognitive Graph, Guidance Policy Engine, Retriever, LLM Prompt Builder, and the Understanding Validator.

## Design Constraints
- **Strict Separation of Concerns**: This engine *orchestrates*, it does not *compute*. It has zero internal logic for prompting, LLM generation, or database schema design.
- **State Machine Driven**: A learning session acts as a finite state machine (Initialized -> Ready -> Running -> Paused -> Replaying -> Completed), ensuring deterministic behavior.
- **Event-Sourced First**: Every major transition triggers an event on the `event_bus.py`, ensuring analytics and the Cognitive Graph stay in sync natively.
- **Interface Driven Orchestration**: Dependencies on the Guidance Engine, LLM Pipeline, and Knowledge Retriever must be abstracted behind clean interfaces (Sprint 15).
