"""
User Domain Models.
Implements the 5 core tables for User management in SQLAlchemy 2.0.
"""
from typing import Optional, List
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, UUIDMixin, TimestampMixin, SoftDeleteMixin

class User(Base, UUIDMixin, TimestampMixin, SoftDeleteMixin):
    """Core User authentication table."""
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    role: Mapped[str] = mapped_column(String(50), default="student", server_default="student")

    # Relationships
    profile: Mapped[Optional["UserProfile"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    preferences: Mapped[Optional["UserPreference"]] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions: Mapped[List["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    subscriptions: Mapped[List["Subscription"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base, UUIDMixin, TimestampMixin):
    """Personal details and demographic information."""
    __tablename__ = "user_profiles"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    first_name: Mapped[Optional[str]] = mapped_column(String(100))
    last_name: Mapped[Optional[str]] = mapped_column(String(100))
    phone_number: Mapped[Optional[str]] = mapped_column(String(20))
    avatar_url: Mapped[Optional[str]] = mapped_column(String(1024))
    date_of_birth: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True))

    user: Mapped["User"] = relationship(back_populates="profile")


class UserPreference(Base, UUIDMixin, TimestampMixin):
    """Personalization and learning preferences (merges with user_personalization spec)."""
    __tablename__ = "user_preferences"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    learning_style: Mapped[str] = mapped_column(String(50), default="mixed", server_default="mixed")
    target_exam: Mapped[str] = mapped_column(String(50), default="JEE", server_default="JEE")
    class_level: Mapped[int] = mapped_column(Integer, default=11, server_default="11")
    theme: Mapped[str] = mapped_column(String(20), default="system")
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True)

    user: Mapped["User"] = relationship(back_populates="preferences")


class UserSession(Base, UUIDMixin, TimestampMixin):
    """Login/Auth session management (OAuth/JWT tracking)."""
    __tablename__ = "user_sessions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    refresh_token: Mapped[str] = mapped_column(String(512), unique=True, index=True)
    expires_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45))
    user_agent: Mapped[Optional[str]] = mapped_column(String(512))
    is_revoked: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="sessions")


class Subscription(Base, UUIDMixin, TimestampMixin):
    """Plans, billing, and access control."""
    __tablename__ = "subscriptions"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    plan_tier: Mapped[str] = mapped_column(String(50), default="free")
    status: Mapped[str] = mapped_column(String(50), default="active") # active, past_due, canceled
    started_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), nullable=False)
    ends_at: Mapped[Optional[DateTime]] = mapped_column(DateTime(timezone=True))
    stripe_customer_id: Mapped[Optional[str]] = mapped_column(String(255))

    user: Mapped["User"] = relationship(back_populates="subscriptions")
