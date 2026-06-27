"""
Database configuration using pydantic-settings.
Manages connection strings, pool sizes, and timeout settings.
"""
from typing import Optional
from pydantic import Field, PostgresDsn, ValidationInfo, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class DatabaseSettings(BaseSettings):
    """
    Database settings strictly adhering to Pydantic v2 and pydantic-settings.
    """
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_prefix="DB_"
    )

    # SQLite for Dev, PostgreSQL for Prod
    ENGINE: str = Field(default="sqlite+aiosqlite", description="Database engine to use.")
    USER: Optional[str] = Field(default=None)
    PASSWORD: Optional[str] = Field(default=None)
    HOST: Optional[str] = Field(default=None)
    PORT: Optional[str] = Field(default=None)
    NAME: str = Field(default="evolve_gm.db")

    # Connection Pool Settings
    POOL_SIZE: int = Field(default=20, description="SQLAlchemy connection pool size.")
    MAX_OVERFLOW: int = Field(default=10, description="SQLAlchemy max overflow connections.")
    POOL_TIMEOUT: int = Field(default=30, description="Pool timeout in seconds.")
    ECHO_SQL: bool = Field(default=False, description="Log all SQL statements (for dev).")

    @property
    def async_database_uri(self) -> str:
        """
        Dynamically constructs the async database URI based on the engine.
        """
        if self.ENGINE.startswith("sqlite"):
            # For SQLite, we just need the file name
            return f"sqlite+aiosqlite:///{self.NAME}"
        
        # For Postgres/Others, construct the full DSN
        if not all([self.USER, self.PASSWORD, self.HOST, self.PORT]):
            raise ValueError("PostgreSQL requires USER, PASSWORD, HOST, and PORT to be set.")
            
        return f"{self.ENGINE}://{self.USER}:{self.PASSWORD}@{self.HOST}:{self.PORT}/{self.NAME}"

# Global instance to be imported by the database session module
db_settings = DatabaseSettings()
