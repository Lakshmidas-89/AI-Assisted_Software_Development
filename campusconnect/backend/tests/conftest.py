import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from config import TestConfig  # noqa: E402


@pytest.fixture()
def app(tmp_path):
    database_path = tmp_path / "test.db"
    application = create_app(TestConfig, DATABASE_PATH=str(database_path))
    yield application


@pytest.fixture()
def client(app):
    return app.test_client()
