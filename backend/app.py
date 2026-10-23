"""REST API with disk persistence and database-enforced atomic stock changes."""
import os
from pathlib import Path
import secrets
import sqlite3
from decimal import Decimal
from typing import Annotated

import jwt
from fastapi import Depends, FastAPI, HTTPException, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.database import Database, public_user, public_vehicle
from backend.schemas import Login, Register, Restock, VehicleInput
from backend.security import hash_password, issue_token, verify_password

ROOT = Path(__file__).resolve().parent.parent
bearer = HTTPBearer(auto_error=False)


def local_secret():
    configured = os.getenv("JWT_SECRET")
    if configured:
        if len(configured) < 32:
            raise RuntimeError("JWT_SECRET must contain at least 32 characters")
        return configured
    # A generated development key survives restarts and is never committed.
    path = ROOT / ".jwt-secret"
    try:
        with path.open("x", opener=lambda p, flags: os.open(p, flags, 0o600)) as file:
            file.write(secrets.token_hex(32))
    except FileExistsError:
        pass
    return path.read_text().strip()


def create_app(database_path=None, jwt_secret=None):
    db = Database(database_path or os.getenv("DATABASE_PATH", str(ROOT / "inventory.db")))
    secret = jwt_secret or local_secret()
    app = FastAPI(title="Motorhaus Inventory API", version="1.0.0", description="Car dealership inventory kata. Authenticate with a bearer token from /api/auth/login.")
    app.state.database = db
    app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(","), allow_methods=["GET", "POST", "PUT", "DELETE"], allow_headers=["Authorization", "Content-Type"])

    def current_user(credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]):
        error = HTTPException(401, "Please sign in to continue", headers={"WWW-Authenticate": "Bearer"})
        if not credentials:
            raise error
        try:
            payload = jwt.decode(credentials.credentials, secret, algorithms=["HS256"], options={"require": ["exp", "sub"]})
            user_id = int(payload["sub"])
        except (jwt.InvalidTokenError, ValueError, TypeError):
            raise error
        with db.connect() as conn:
            user = conn.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        if user is None:
            raise error
        return public_user(user)

    def admin_user(user=Depends(current_user)):
        if user["role"] != "admin":
            raise HTTPException(403, "Administrator access required")
        return user

    def session(user):
        return {"access_token": issue_token(user["id"], secret), "token_type": "bearer", "user": public_user(user)}

    @app.get("/api/health")
    def health():
        with db.connect() as conn:
            conn.execute("SELECT 1")
        return {"status": "ok"}

    @app.post("/api/auth/register", status_code=201)
    def register(data: Register):
        try:
            with db.connect() as conn:
                cursor = conn.execute("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)", (data.name, str(data.email).lower(), hash_password(data.password)))
                user = conn.execute("SELECT * FROM users WHERE id=?", (cursor.lastrowid,)).fetchone()
        except sqlite3.IntegrityError:
            raise HTTPException(409, "An account with this email already exists")
        return session(user)

    @app.post("/api/auth/login")
    def login(data: Login):
        with db.connect() as conn:
            user = conn.execute("SELECT * FROM users WHERE email=?", (str(data.email).lower(),)).fetchone()
        if user is None:
            # Keep password work comparable for known and unknown accounts.
            hash_password(data.password)
            raise HTTPException(401, "Invalid email or password")
        if not verify_password(data.password, user["password_hash"]):
            raise HTTPException(401, "Invalid email or password")
        return session(user)

    @app.get("/api/auth/me")
    def me(user=Depends(current_user)):
        return user

    @app.get("/api/vehicles", dependencies=[Depends(current_user)])
    def list_vehicles():
        with db.connect() as conn:
            return [public_vehicle(row) for row in conn.execute("SELECT * FROM vehicles ORDER BY id")]

    @app.get("/api/vehicles/search", dependencies=[Depends(current_user)])
    def search(make: str = "", model: str = "", category: str = "", q: str = "",
               min_price: Annotated[Decimal | None, Query(ge=0, le=1_000_000_000)] = None,
               max_price: Annotated[Decimal | None, Query(ge=0, le=1_000_000_000)] = None):
        if min_price is not None and max_price is not None and min_price > max_price:
            raise HTTPException(422, "Minimum price cannot exceed maximum price")
        conditions, values = [], []
        for column, value in (("make", make), ("model", model), ("category", category)):
            if value:
                conditions.append(f"instr(lower({column}), lower(?)) > 0")
                values.append(value)
        if q:
            conditions.append("instr(lower(make || ' ' || model || ' ' || category), lower(?)) > 0")
            values.append(q)
        if min_price is not None:
            conditions.append("price_cents >= ?")
            values.append(float(min_price * 100))
        if max_price is not None:
            conditions.append("price_cents <= ?")
            values.append(float(max_price * 100))
        sql = "SELECT * FROM vehicles" + (" WHERE " + " AND ".join(conditions) if conditions else "") + " ORDER BY id"
        with db.connect() as conn:
            return [public_vehicle(row) for row in conn.execute(sql, values)]

    @app.post("/api/vehicles", status_code=201, dependencies=[Depends(current_user)])
    def add_vehicle(data: VehicleInput):
        with db.connect() as conn:
            cursor = conn.execute("INSERT INTO vehicles(make,model,category,price_cents,quantity) VALUES(?,?,?,?,?)", (data.make, data.model, data.category, int(data.price * 100), data.quantity))
            return public_vehicle(conn.execute("SELECT * FROM vehicles WHERE id=?", (cursor.lastrowid,)).fetchone())

    @app.put("/api/vehicles/{vehicle_id}", dependencies=[Depends(current_user)])
    def update_vehicle(vehicle_id: int, data: VehicleInput):
        with db.connect() as conn:
            cursor = conn.execute("UPDATE vehicles SET make=?,model=?,category=?,price_cents=?,quantity=? WHERE id=?", (data.make, data.model, data.category, int(data.price * 100), data.quantity, vehicle_id))
            if cursor.rowcount == 0:
                raise HTTPException(404, "Vehicle not found")
            return public_vehicle(conn.execute("SELECT * FROM vehicles WHERE id=?", (vehicle_id,)).fetchone())

    @app.delete("/api/vehicles/{vehicle_id}", status_code=204, dependencies=[Depends(admin_user)])
    def delete_vehicle(vehicle_id: int):
        with db.connect() as conn:
            if conn.execute("DELETE FROM vehicles WHERE id=?", (vehicle_id,)).rowcount == 0:
                raise HTTPException(404, "Vehicle not found")
        return Response(status_code=204)

    @app.post("/api/vehicles/{vehicle_id}/purchase", dependencies=[Depends(current_user)])
    def purchase(vehicle_id: int):
        with db.connect() as conn:
            # A conditional write prevents concurrent buyers from overselling.
            cursor = conn.execute("UPDATE vehicles SET quantity=quantity-1 WHERE id=? AND quantity>0", (vehicle_id,))
            row = conn.execute("SELECT * FROM vehicles WHERE id=?", (vehicle_id,)).fetchone()
            if row is None:
                raise HTTPException(404, "Vehicle not found")
            if cursor.rowcount == 0:
                raise HTTPException(409, "This vehicle is out of stock")
            return public_vehicle(row)

    @app.post("/api/vehicles/{vehicle_id}/restock", dependencies=[Depends(admin_user)])
    def restock(vehicle_id: int, data: Restock):
        with db.connect() as conn:
            if conn.execute("UPDATE vehicles SET quantity=quantity+? WHERE id=?", (data.quantity, vehicle_id)).rowcount == 0:
                raise HTTPException(404, "Vehicle not found")
            return public_vehicle(conn.execute("SELECT * FROM vehicles WHERE id=?", (vehicle_id,)).fetchone())

    return app
