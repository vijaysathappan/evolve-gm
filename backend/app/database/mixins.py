"""
SQLAlchemy Mixins for common model attributes and behaviors.
"""
from datetime import datetime, timezone
import uuid
from sqlalchemy import Column, DateTime, Boolean, String
from sqlalchemy.orm import declarative_mixin, Mapped, mapped_column
from sqlalchemy.sql import func

def generate_uuid() -> str:
    """Generate a standard UUID4 string."""
    return str(uuid.uuid4())

@declarative_mixin
class UUIDMixin:
    """
    Mixin that adds a UUID string primary key to a model.
    """
    id: Mapped[str] = mapped_column(
        String(36), 
        primary_key=True, 
        default=generate_uuid, 
        index=True
    )

@declarative_mixin
class TimestampMixin:
    """
    Mixin that adds standard created_at and updated_at timestamps.
    Automatically handles timezone-aware UTC datetimes.
    """
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        nullable=False
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(), 
        onupdate=func.now(), 
        nullable=False
    )

@declarative_mixin
class SoftDeleteMixin:
    """
    Mixin that provides soft delete capabilities.
    Instead of deleting the row, flags it as deleted.
    """
    is_deleted: Mapped[bool] = mapped_column(
        Boolean, 
        default=False, 
        nullable=False,
        index=True
    )
    
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), 
        nullable=True
    )

    def soft_delete(self) -> None:
        """Mark the record as deleted."""
        self.is_deleted = True
        self.deleted_at = datetime.now(timezone.utc)

    def restore(self) -> None:
        """Restore a soft-deleted record."""
        self.is_deleted = False
        self.deleted_at = None
