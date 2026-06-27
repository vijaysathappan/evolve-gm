# Architecture: Digital Classroom Engine

## Purpose
The Digital Classroom Engine (DCE) orchestrates the real-time presentation layer. It translates abstract teaching decisions into perfectly synchronized, multi-modal UI instructions.

## Design Constraints
- **Digital Classroom Event Bus (DCEB)**: The nervous system of the DCE. Controllers do not invoke one another directly. They emit events to the DCEB, which broadcasts them to subscribed synchronizers.
- **Dumb Renderer Paradigm**: The React UI has zero teaching logic. It only renders structured instructions (e.g., `{"type": "highlight", "target": "p_4"}`) received from the DCE's Streaming Coordinator.
- **Event-Driven Orchestration**: Everything is synchronized (Teacher, Book, Voice, Blackboard).
- **Loose Coupling**: By depending solely on events, the DCE can effortlessly support future modalities (VR, Mobile, Smart TV) without architectural changes.
