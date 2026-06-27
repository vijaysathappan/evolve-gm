# Architecture: Guidance Policy Engine (GPE) Skeleton

## Purpose
The Guidance Policy Engine is the central decision-making brain of the platform. It is responsible for determining *how, what, and when* to teach a concept, completely independent of the LLM generation phase.

## Design Philosophy
- **Separation of Concerns**: Each decision domain (Learning, Teaching, Difficulty, Language, Assessment, Revision, Recovery, Motivation) is handled by a dedicated, isolated Planner.
- **SOLID Principles**: The planners implement a common interface. The Decision Engine aggregates planner outputs.
- **Zero-LLM Domain**: The GPE operates strictly on algorithmic rules, scoring systems, and the Student Cognitive Graph.

## Structure
- `planners/`: Contains all single-responsibility planners.
- `decision_engine.py`: Central conflict resolution and aggregation.
- `schemas.py`: Pydantic models for internal messaging.
- `service.py`: The single entrypoint for external modules to request Guidance Decisions.
