"""
Database session management.
Configures the SQLAlchemy 2.0 AsyncEngine and async session factory.
"""
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.database.config import db_settings

# Construct the engine configuration arguments based on the engine type
engine_kwargs = {
    "echo": db_settings.ECHO_SQL,
}

# SQLite requires different pool settings than Postgres
if db_settings.ENGINE.startswith("sqlite"):
    # SQLite does not support standard connection pooling like Postgres
    pass
else:
    engine_kwargs.update({
        "pool_size": db_settings.POOL_SIZE,
        "max_overflow": db_settings.MAX_OVERFLOW,
        "pool_timeout": db_settings.POOL_TIMEOUT,
        "pool_pre_ping": True,  # Ensures connection is valid before using it
    })

# Create the AsyncEngine
engine = create_async_engine(
    db_settings.async_database_uri,
    **engine_kwargs
)

# Create the session factory
async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)

async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to be injected into FastAPI routes or Domain Services.
    Yields an AsyncSession and ensures it is safely closed.
    """
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
