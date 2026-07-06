import os
import pytest

# Force test database URL BEFORE importing any app modules
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test.db"

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    yield
    # Clean up test database file after session finishes
    test_db_path = "./test.db"
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except Exception:
            pass
