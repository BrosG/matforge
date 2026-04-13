"""SQLAlchemy database setup and session management."""

from __future__ import annotations

import logging
from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import QueuePool, StaticPool

from app.core.config import settings

logger = logging.getLogger(__name__)


class Base(DeclarativeBase):
    pass


def _create_engine():
    url = settings.DATABASE_URL
    if "sqlite" in url:
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_engine(
        url,
        poolclass=QueuePool,
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_pre_ping=True,
        pool_recycle=1800,  # Recycle connections every 30min (Cloud Run idle timeout)
    )


engine = _create_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency: yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context() -> Generator[Session, None, None]:
    """Context manager for database sessions (for use outside FastAPI)."""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def check_connection() -> bool:
    """Check database connectivity."""
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection check failed: {e}")
        return False


def warm_pool() -> None:
    """Pre-warm the connection pool on startup to eliminate cold-start latency.

    Opens pool_size connections, executes a trivial query on each to ensure
    they are fully established (TCP handshake + TLS + auth complete), then
    returns them to the pool.  Also ensures the pg_trgm extension exists
    for trigram indexes.
    """
    if "sqlite" in str(engine.url):
        return

    pool_size = getattr(settings, "DB_POOL_SIZE", 5)
    connections = []
    try:
        for _ in range(pool_size):
            conn = engine.connect()
            conn.execute(text("SELECT 1"))
            connections.append(conn)
        logger.info("Connection pool warmed: %d connections ready", len(connections))
    except Exception as e:
        logger.warning("Pool warming partially failed: %s", e)
    finally:
        for conn in connections:
            try:
                conn.close()
            except Exception:
                pass

    # Ensure pg_trgm extension exists (needed for gin_trgm_ops indexes)
    try:
        with engine.begin() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
            logger.info("pg_trgm extension ensured")
    except Exception as e:
        logger.warning("Could not create pg_trgm extension: %s", e)


def create_tables() -> None:
    """Create all tables and add any missing columns.

    SQLAlchemy's create_all() only creates missing tables — it does NOT
    add columns to existing tables. This function inspects the live schema
    and issues ALTER TABLE ADD COLUMN for any column defined in the ORM
    model but absent from the database.
    """
    Base.metadata.create_all(bind=engine)
    _add_missing_columns()


def apply_indexes() -> None:
    """Create any indexes defined in ORM __table_args__ that don't exist yet.

    SQLAlchemy's create_all() skips indexes on existing tables.
    Never crashes startup — all errors are caught and logged.
    """
    try:
        from sqlalchemy import text

        with engine.connect() as conn:
            # Ensure pg_trgm extension for trigram indexes
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm"))
                conn.commit()
            except Exception:
                pass

        # Get existing index names
        with engine.connect() as conn:
            existing = set(
                row[0] for row in conn.execute(text(
                    "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'"
                ))
            )

        # Create missing indexes
        with engine.begin() as conn:
            for table_name, table in Base.metadata.tables.items():
                for idx in table.indexes:
                    if idx.name in existing:
                        continue
                    try:
                        idx.create(bind=conn)
                        logger.info("Created index: %s", idx.name)
                    except Exception as e:
                        logger.warning("Could not create index %s: %s", idx.name, e)
    except Exception as e:
        logger.warning("apply_indexes failed (non-fatal): %s", e)


def _add_missing_columns() -> None:
    """Compare ORM models against live DB schema and add missing columns."""
    from sqlalchemy import inspect as sa_inspect, text

    inspector = sa_inspect(engine)
    existing_tables = set(inspector.get_table_names())

    with engine.begin() as conn:
        for table_name, table in Base.metadata.tables.items():
            if table_name not in existing_tables:
                continue

            existing_cols = {c["name"] for c in inspector.get_columns(table_name)}

            for col in table.columns:
                if col.name in existing_cols:
                    continue

                # Build column type string for ALTER TABLE
                col_type = col.type.compile(dialect=engine.dialect)
                nullable = "NULL" if col.nullable else "NOT NULL"
                default = ""
                if col.server_default is not None:
                    default = f" DEFAULT {col.server_default.arg}"

                sql = f'ALTER TABLE "{table_name}" ADD COLUMN "{col.name}" {col_type} {nullable}{default}'
                logger.info("Adding missing column: %s.%s (%s)", table_name, col.name, col_type)
                try:
                    conn.execute(text(sql))
                except Exception as e:
                    # Column might already exist in a concurrent startup
                    logger.warning("Could not add column %s.%s: %s", table_name, col.name, e)
