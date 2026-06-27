"""
Curriculum Domain Models.
Implements the 5 core tables for Curriculum knowledge (Subjects, Chapters, Concepts, Explanations, Questions).
Using SQLAlchemy 2.0 and translating PostgreSQL arrays to JSON for SQLite compatibility.
"""
from typing import Optional, List, Dict, Any
from sqlalchemy import String, Integer, Float, ForeignKey, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, UUIDMixin, TimestampMixin

class Subject(Base, UUIDMixin, TimestampMixin):
    """Top-level curriculum subjects (Physics, Chemistry, etc.)."""
    __tablename__ = "curriculum_subjects"

    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    code: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    exam_target: Mapped[str] = mapped_column(String(50), default="JEE")
    
    chapters: Mapped[List["Chapter"]] = relationship(back_populates="subject", cascade="all, delete-orphan")


class Chapter(Base, UUIDMixin, TimestampMixin):
    """Chapters within a subject."""
    __tablename__ = "curriculum_chapters"

    subject_id: Mapped[str] = mapped_column(ForeignKey("curriculum_subjects.id", ondelete="CASCADE"), nullable=False)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    class_level: Mapped[int] = mapped_column(Integer, default=11)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    exam_weightage: Mapped[float] = mapped_column(Float, default=0.0)
    estimated_hours: Mapped[float] = mapped_column(Float, default=3.0)

    subject: Mapped["Subject"] = relationship(back_populates="chapters")
    concepts: Mapped[List["Concept"]] = relationship(back_populates="chapter", cascade="all, delete-orphan")
    questions: Mapped[List["Question"]] = relationship(back_populates="chapter", cascade="all, delete-orphan")


class Concept(Base, UUIDMixin, TimestampMixin):
    """The smallest learning unit."""
    __tablename__ = "curriculum_concepts"

    chapter_id: Mapped[str] = mapped_column(ForeignKey("curriculum_chapters.id", ondelete="CASCADE"), index=True, nullable=False)
    
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    definition: Mapped[Optional[str]] = mapped_column(Text)
    summary: Mapped[Optional[str]] = mapped_column(Text)
    difficulty: Mapped[int] = mapped_column(Integer, default=3)
    bloom_level: Mapped[str] = mapped_column(String(50), default="understand")
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    
    # Store arrays as JSON to maintain SQLite compatibility
    prerequisite_concept_ids: Mapped[List[str]] = mapped_column(JSON, default=list)
    next_concept_ids: Mapped[List[str]] = mapped_column(JSON, default=list)
    keywords: Mapped[List[str]] = mapped_column(JSON, default=list)
    formula_latex: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    confidence_threshold: Mapped[float] = mapped_column(Float, default=0.75)
    estimated_minutes: Mapped[int] = mapped_column(Integer, default=20)

    chapter: Mapped["Chapter"] = relationship(back_populates="concepts")
    explanations: Mapped[List["ExplanationNode"]] = relationship(back_populates="concept", cascade="all, delete-orphan")
    questions: Mapped[List["Question"]] = relationship(back_populates="concept", cascade="all, delete-orphan")


class ExplanationNode(Base, UUIDMixin, TimestampMixin):
    """Multiple teaching paths for each concept."""
    __tablename__ = "explanation_nodes"

    concept_id: Mapped[str] = mapped_column(ForeignKey("curriculum_concepts.id", ondelete="CASCADE"), index=True, nullable=False)
    
    teaching_style: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    difficulty: Mapped[int] = mapped_column(Integer, default=3)
    target_learner_style: Mapped[str] = mapped_column(String(50), default="mixed")
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    content_media_url: Mapped[Optional[str]] = mapped_column(String(1024))
    expected_outcome: Mapped[Optional[str]] = mapped_column(Text)
    
    next_node_id: Mapped[Optional[str]] = mapped_column(ForeignKey("explanation_nodes.id"))
    prev_node_id: Mapped[Optional[str]] = mapped_column(ForeignKey("explanation_nodes.id"))
    order_in_path: Mapped[int] = mapped_column(Integer, default=1)

    concept: Mapped["Concept"] = relationship(back_populates="explanations")


class Question(Base, UUIDMixin, TimestampMixin):
    """Question Bank."""
    __tablename__ = "questions"

    concept_id: Mapped[Optional[str]] = mapped_column(ForeignKey("curriculum_concepts.id"), index=True)
    chapter_id: Mapped[Optional[str]] = mapped_column(ForeignKey("curriculum_chapters.id"))
    
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_type: Mapped[str] = mapped_column(String(50), nullable=False)
    
    # Store options and arrays as JSON
    options: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON)
    correct_answer: Mapped[str] = mapped_column(Text, nullable=False)
    solution_steps: Mapped[List[str]] = mapped_column(JSON, default=list)
    hint_text: Mapped[Optional[str]] = mapped_column(Text)
    common_mistakes: Mapped[List[str]] = mapped_column(JSON, default=list)
    
    difficulty: Mapped[int] = mapped_column(Integer, default=3)
    bloom_level: Mapped[str] = mapped_column(String(50), default="apply")
    exam_type: Mapped[str] = mapped_column(String(50), default="JEE_MAIN")
    expected_time_seconds: Mapped[int] = mapped_column(Integer, default=120)
    similar_question_ids: Mapped[List[str]] = mapped_column(JSON, default=list)

    concept: Mapped[Optional["Concept"]] = relationship(back_populates="questions")
    chapter: Mapped[Optional["Chapter"]] = relationship(back_populates="questions")
