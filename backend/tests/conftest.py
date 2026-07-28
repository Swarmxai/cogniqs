"""Isolate pytest from the developer SQLite database.

Must set DATABASE_URL before `app.database` (and thus `app.main`) is imported.
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Point every test run at a disposable DB so drop_all never wipes cogniqs.db
_TEST_DB = Path(tempfile.gettempdir()) / f"cogniqs_pytest_{os.getpid()}.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TEST_DB}"
