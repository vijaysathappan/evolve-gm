import asyncio
import sys
import os

# Add the backend directory to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base, engine, db_settings

async def init_db() -> None:
    print(f"Initializing database: {db_settings.async_database_uri}")
    async with engine.begin() as conn:
        # Create all tables stored in Base.metadata
        # Currently, this is empty because no domain models are imported yet.
        await conn.run_sync(Base.metadata.create_all)
    print("Database initialization complete.")

if __name__ == "__main__":
    asyncio.run(init_db())
