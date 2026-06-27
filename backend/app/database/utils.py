"""
Database utility functions.
Includes helpers for pagination, connection health checks, and query execution.
"""
from typing import Any, TypeVar, Sequence
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase

ModelType = TypeVar("ModelType", bound=DeclarativeBase)

async def check_database_health(session: AsyncSession) -> bool:
    """
    Performs a simple query to ensure the database connection is healthy.
    """
    try:
        await session.execute(select(1))
        return True
    except Exception:
        return False

async def paginate(
    session: AsyncSession,
    query: Any,
    page: int = 1,
    page_size: int = 50
) -> dict[str, Any]:
    """
    Executes a query with pagination.
    Returns the items for the current page and pagination metadata.
    """
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 50
    if page_size > 100:
        page_size = 100

    offset = (page - 1) * page_size

    # Calculate total rows efficiently
    # Note: query.statement.with_only_columns(func.count()) is typical for 2.0
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await session.execute(count_query)
    total_items = total_result.scalar_one_or_none() or 0

    # Fetch paginated items
    paginated_query = query.offset(offset).limit(page_size)
    result = await session.execute(paginated_query)
    
    # Try scalars().all() for ORM objects, fallback to mappings().all()
    try:
        items = list(result.scalars().all())
    except Exception:
        items = [dict(row) for row in result.mappings().all()]

    total_pages = (total_items + page_size - 1) // page_size if total_items > 0 else 1

    return {
        "items": items,
        "page": page,
        "page_size": page_size,
        "total_items": total_items,
        "total_pages": total_pages,
        "has_next": page < total_pages,
        "has_previous": page > 1
    }
