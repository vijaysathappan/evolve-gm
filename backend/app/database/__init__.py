"""
Database Module.
Exposes common infrastructure components for the Domain layer to consume.
"""
from .base import Base, metadata
from .config import db_settings
from .session import get_db_session, engine
from .mixins import UUIDMixin, TimestampMixin, SoftDeleteMixin
from .types import GUID, UTCDateTime
from .utils import paginate, check_database_health

__all__ = [
    "Base",
    "metadata",
    "db_settings",
    "get_db_session",
    "engine",
    "UUIDMixin",
    "TimestampMixin",
    "SoftDeleteMixin",
    "GUID",
    "UTCDateTime",
    "paginate",
    "check_database_health"
]
