# Architecture: Cognitive Learning Planner Engine (CLPE)

## Purpose
The CLPE serves as the master strategist for the student. While the Guidance Engine decides *how* to teach a specific concept during a session, the CLPE decides *what* concepts, practices, or revisions should happen across days, weeks, or months to reach mastery.

## Design Constraints
- **Separation from Teaching**: The CLPE does not teach, retrieve facts, or format prompts. It outputs high-level directives (e.g., `DailyPlan`, `OptimalLearningPath`).
- **Data-Driven Strategy**: It relies entirely on cognitive evidence gathered by the `Understanding Validator Engine` and the historical trajectory stored in the `Student Cognitive Graph`.
- **Learning Path Optimizer (Sprint 16)**: The standout research feature that continuously recalculates the most efficient route to mastery based on memory decay, remaining time, and prerequisite gaps.
