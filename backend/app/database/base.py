"""
Production-grade SQLAlchemy 2.0 Declarative Base.
Configures naming conventions for automated constraint naming (alembic support).
"""
import re
from typing import Any
from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase, declared_attr

# Naming convention for Alembic migrations to automatically name constraints/indexes
NAMING_CONVENTION = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=NAMING_CONVENTION)

class Base(DeclarativeBase):
    """
    Base class for all SQLAlchemy 2.0 declarative models.
    Provides a default table name generation based on the class name.
    """
    metadata = metadata

    @declared_attr.directive
    def __tablename__(cls) -> str:
        """
        Automatically generates table names by converting CamelCase class names to snake_case.
        Example: 'LearningSession' becomes 'learning_session'.
        """
        name = cls.__name__
        s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
        return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

    def dict(self) -> dict[str, Any]:
        """
        Utility method to convert model instance to dictionary.
        Useful for quick serialization (though Pydantic is preferred).
        """
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
