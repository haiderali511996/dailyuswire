from collections.abc import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import settings

DATABASE_URL = settings.sqlalchemy_url
IS_SQLITE = DATABASE_URL.startswith("sqlite")
IS_MYSQL = DATABASE_URL.startswith("mysql")

connect_args: dict = {"check_same_thread": False} if IS_SQLITE else {}
engine_kwargs: dict = {}

if IS_MYSQL:
    # Shared hosts drop idle MySQL connections (wait_timeout is often 300s) and
    # cap concurrent connections hard, so recycle early and stay small.
    engine_kwargs.update(
        pool_recycle=180,
        pool_size=5,
        max_overflow=5,
        pool_timeout=30,
    )
    connect_args.update(connect_timeout=10)

engine = create_engine(
    DATABASE_URL, connect_args=connect_args, pool_pre_ping=True, **engine_kwargs
)

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


def apply_mysql_table_options() -> None:
    """Force every table to InnoDB + utf8mb4.

    Set on the table kwargs rather than on Base.__table_args__, because any
    model that declares its own __table_args__ silently overrides the base's.
    utf8mb4 (not MySQL's 3-byte "utf8") is what stores emoji and the smart
    quotes and dashes that turn up in pasted article copy.
    """
    if not IS_MYSQL:
        return
    for table in Base.metadata.tables.values():
        table.kwargs.setdefault("mysql_engine", "InnoDB")
        table.kwargs.setdefault("mysql_charset", "utf8mb4")
        table.kwargs.setdefault("mysql_collate", "utf8mb4_unicode_ci")


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
