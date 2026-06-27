# Architecture: Understanding Validator Engine (UVE)

## Purpose
The UVE represents the core cognitive assessment engine of EvolveGM. Its primary responsibility is to observe student interactions (quizzes, reflections, self-explanations, behaviors) and translate them into a structured, multi-dimensional `UnderstandingScore` and `CognitiveDiagnosis`.

## Design Constraints
- **Zero LLM Core**: The core evaluation logic is deterministic. Any future integration of LLMs (e.g., for parsing self-explanations) must be strictly hidden behind dependency-injected interfaces (`interfaces.py`) to prevent coupling.
- **Single Source of Truth**: Only the `student_graph_updater.py` within this module is allowed to mutate the Student Cognitive Graph.
- **Closed Loop**: The final output of the UVE is a `Recommendation` that is fed back into the Guidance Policy Engine, completing the cognitive learning loop.
