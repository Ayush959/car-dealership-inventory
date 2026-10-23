"""Explicit, repeatable demo setup. Never runs automatically in the API."""
import argparse
from backend.app import create_app
from backend.security import hash_password

VEHICLES = [
    ("Porsche", "911 Carrera", "Sports", 11440000, 3),
    ("Mercedes-Benz", "G 550", "SUV", 14300000, 2),
    ("BMW", "M4 Competition", "Sports", 8370000, 4),
    ("Audi", "e-tron GT", "Electric", 10650000, 5),
    ("Land Rover", "Defender 110", "SUV", 6090000, 0),
    ("Mercedes-Benz", "S 580", "Sedan", 12400000, 2),
    ("Tesla", "Model 3", "Electric", 3899000, 8),
    ("Lexus", "ES 350", "Sedan", 4299000, 6),
]


def seed(admin_email, admin_password):
    app = create_app()
    with app.state.database.connect() as db:
        db.execute("INSERT OR IGNORE INTO users(name,email,password_hash,role) VALUES(?,?,?,?)", ("Alex Morgan", admin_email.lower(), hash_password(admin_password), "admin"))
        db.execute("INSERT OR IGNORE INTO users(name,email,password_hash,role) VALUES(?,?,?,?)", ("Jamie Parker", "buyer@example.com", hash_password("BuyerDemo123!"), "user"))
        if db.execute("SELECT COUNT(*) FROM vehicles").fetchone()[0] == 0:
            db.executemany("INSERT INTO vehicles(make,model,category,price_cents,quantity) VALUES(?,?,?,?,?)", VEHICLES)
    print("Demo data ready. Administrator:", admin_email)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--admin-email", default="admin@example.com")
    parser.add_argument("--admin-password", default="AdminDemo123!")
    args = parser.parse_args()
    if len(args.admin_password) < 8:
        parser.error("Admin password must have at least 8 characters")
    seed(args.admin_email, args.admin_password)
