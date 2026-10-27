import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Default to PostgreSQL, with flexible SQLite fallback for offline academic evaluation
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://cafeteria_user:cafeteria_secure_pass@localhost:5432/smart_cafeteria"
)

# If SQLite is configured or used during unit tests
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL, 
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency to provide a transactional database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
