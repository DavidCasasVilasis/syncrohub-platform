from sqlmodel import SQLModel, create_engine, Session
from typing import Generator
from app.core.config import settings

# Conexión adaptada para SQLite (habilita multi-hilo para desarrollo rápido)
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    connect_args=connect_args
)


def init_db() -> None:
    """Crea las tablas en la base de datos si no existen."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Inyección de dependencias para sesiones de base de datos en endpoints."""
    with Session(engine) as session:
        yield session
