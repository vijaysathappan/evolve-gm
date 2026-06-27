"""
Custom SQLAlchemy types for cross-database compatibility.
"""
import uuid
from typing import Any, Optional
from sqlalchemy.types import TypeDecorator, CHAR, DateTime
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from datetime import datetime, timezone

class GUID(TypeDecorator):
    """
    Platform-independent GUID type.
    Uses PostgreSQL's UUID type if available, otherwise uses CHAR(32).
    """
    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect: Any) -> Any:
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID())
        else:
            return dialect.type_descriptor(CHAR(32))

    def process_bind_param(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return value
        elif dialect.name == "postgresql":
            return str(value)
        else:
            if not isinstance(value, uuid.UUID):
                return "%.32x" % uuid.UUID(value).int
            else:
                # hexstring
                return "%.32x" % value.int

    def process_result_value(self, value: Any, dialect: Any) -> Any:
        if value is None:
            return value
        else:
            if not isinstance(value, uuid.UUID):
                value = uuid.UUID(value)
            return value


class UTCDateTime(TypeDecorator):
    """
    SQLAlchemy type for UTC-aware datetimes.
    Ensures that datetimes saved to the database are always in UTC,
    and datetimes retrieved from the database always have the UTC timezone attached.
    """
    impl = DateTime
    cache_ok = True

    def process_bind_param(self, value: Optional[datetime], dialect: Any) -> Optional[datetime]:
        if value is not None:
            if value.tzinfo is None:
                # If naive, assume UTC
                value = value.replace(tzinfo=timezone.utc)
            else:
                # Convert to UTC
                value = value.astimezone(timezone.utc)
        return value

    def process_result_value(self, value: Optional[datetime], dialect: Any) -> Optional[datetime]:
        if value is not None:
            if value.tzinfo is None:
                # Attach UTC if database returned a naive datetime
                value = value.replace(tzinfo=timezone.utc)
            else:
                value = value.astimezone(timezone.utc)
        return value
