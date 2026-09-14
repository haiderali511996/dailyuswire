from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

IS_SQLITE = settings.database_url.startswith("sqlite")
connect_args = {"check_same_thread": False} if IS_SQLITE else {}

engine = create_engine(settings.database_url, connect_args=connect_args, pool_pre_ping=True)

if IS_SQLITE:

    @event.listens_for(Engine, "connect")
    def _sqlite_pragmas(dbapi_connection, _record) -> None:  # pragma: no cover - driver hook
        """SQLite ignores foreign keys unless asked, which silently breaks
        ON DELETE CASCADE and leaves orphaned join rows behind. WAL mode also
        keeps reads from blocking while the newsroom writes."""
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.close()
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
