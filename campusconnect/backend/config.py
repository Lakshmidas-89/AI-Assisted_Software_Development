import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


class Config:
    DATABASE_PATH = os.environ.get(
        "DATABASE_PATH", str(BASE_DIR / "instance" / "campusconnect.db")
    )
    SEED_DATA = True
    MAX_CONTENT_LENGTH = 1024 * 1024


class TestConfig(Config):
    TESTING = True
