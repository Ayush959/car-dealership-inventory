"""SQLite connection boundary. Money is stored as integer cents."""
from contextlib import contextmanager
from pathlib import Path
import sqlite3


class Database:
    def __init__(self, path):
        self.path = str(path)
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin'))
                );
                CREATE TABLE IF NOT EXISTS vehicles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    make TEXT NOT NULL,
                    model TEXT NOT NULL,
                    category TEXT NOT NULL,
                    price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
                    quantity INTEGER NOT NULL CHECK(quantity >= 0)
                );
            """)

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.path, timeout=10)
        db.row_factory = sqlite3.Row
        try:
            with db:
                yield db
        finally:
            db.close()


def public_vehicle(row):
    return {"id": row["id"], "make": row["make"], "model": row["model"],
            "category": row["category"], "price": f"{row['price_cents'] // 100}.{row['price_cents'] % 100:02d}",
            "quantity": row["quantity"]}


def public_user(row):
    return {key: row[key] for key in ("id", "name", "email", "role")}
