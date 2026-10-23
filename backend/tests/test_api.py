"""Contract tests written before implementation; every test uses disk-backed SQLite."""
from concurrent.futures import ThreadPoolExecutor
import sqlite3

import jwt
import pytest
from fastapi.testclient import TestClient

from backend.app import create_app

SECRET = "test-only-secret-that-is-at-least-32-characters"
CAR = {"make": "Porsche", "model": "911 Carrera", "category": "Sports", "price": "114400.00", "quantity": 3}


@pytest.fixture
def setup(tmp_path):
    path = tmp_path / "inventory.db"
    app = create_app(path, SECRET)
    with TestClient(app) as client:
        yield client, path


def register(client, email="buyer@example.com"):
    return client.post("/api/auth/register", json={"name": "Test Driver", "email": email, "password": "StrongPass123!"})


def headers(client, path=None, admin=False, email="buyer@example.com"):
    register(client, email)
    if admin:
        with sqlite3.connect(path) as db:
            db.execute("UPDATE users SET role='admin' WHERE email=?", (email,))
    response = client.post("/api/auth/login", json={"email": email, "password": "StrongPass123!"})
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


def add(client, auth, **changes):
    return client.post("/api/vehicles", headers=auth, json=CAR | changes)


def test_registration_hashes_password_and_returns_user(setup):
    client, path = setup
    response = register(client)
    assert response.status_code == 201
    assert response.json()["user"]["role"] == "user"
    assert "password" not in str(response.json())
    with sqlite3.connect(path) as db:
        password_hash = db.execute("SELECT password_hash FROM users").fetchone()[0]
    assert password_hash != "StrongPass123!"
    assert password_hash.startswith("pbkdf2_sha256$")


def test_duplicate_email_is_case_insensitive(setup):
    client, _ = setup
    register(client)
    assert register(client, "BUYER@example.com").status_code == 409


@pytest.mark.parametrize("changes", [{"email": "bad"}, {"password": "short"}, {"name": " "}, {"role": "admin"}])
def test_registration_validation_and_no_self_promotion(setup, changes):
    client, _ = setup
    assert client.post("/api/auth/register", json={"name": "Driver", "email": "a@example.com", "password": "StrongPass123!"} | changes).status_code == 422


def test_login_and_current_user(setup):
    client, _ = setup
    auth = headers(client)
    response = client.get("/api/auth/me", headers=auth)
    assert response.status_code == 200
    assert response.json()["email"] == "buyer@example.com"


@pytest.mark.parametrize("email,password", [("nobody@example.com", "StrongPass123!"), ("buyer@example.com", "wrong")])
def test_invalid_credentials(setup, email, password):
    client, _ = setup
    register(client)
    assert client.post("/api/auth/login", json={"email": email, "password": password}).status_code == 401


@pytest.mark.parametrize("method,url", [("get", "/api/vehicles"), ("get", "/api/vehicles/search"), ("post", "/api/vehicles"), ("put", "/api/vehicles/1"), ("delete", "/api/vehicles/1"), ("post", "/api/vehicles/1/purchase"), ("post", "/api/vehicles/1/restock")])
def test_all_vehicle_endpoints_require_auth(setup, method, url):
    client, _ = setup
    assert getattr(client, method)(url).status_code == 401


@pytest.mark.parametrize("token", ["garbage", jwt.encode({"sub": "1", "exp": 1}, SECRET), jwt.encode({"sub": "1", "exp": 9999999999}, "wrong-secret-that-is-long-enough-now")])
def test_invalid_expired_or_forged_token(setup, token):
    client, _ = setup
    assert client.get("/api/vehicles", headers={"Authorization": f"Bearer {token}"}).status_code == 401


def test_vehicle_create_read_update_and_persistence(setup):
    client, path = setup
    auth = headers(client)
    response = add(client, auth)
    assert response.status_code == 201
    vehicle = response.json()
    assert vehicle["id"] > 0
    assert float(vehicle["price"]) == 114400
    updated = client.put(f"/api/vehicles/{vehicle['id']}", headers=auth, json=CAR | {"price": "115000.25"})
    assert updated.status_code == 200
    with TestClient(create_app(path, SECRET)) as reopened:
        persisted = reopened.get("/api/vehicles", headers=auth).json()
        assert len(persisted) == 1
        assert float(persisted[0]["price"]) == 115000.25


@pytest.mark.parametrize("changes", [{"quantity": -1}, {"quantity": 1.5}, {"quantity": True}, {"price": -1}, {"price": "NaN"}, {"price": "1.001"}, {"make": " "}, {"category": " "}, {"model": "x" * 121}])
def test_vehicle_validation(setup, changes):
    client, _ = setup
    assert add(client, headers(client), **changes).status_code == 422


@pytest.mark.parametrize("query,expected", [("make=por", 1), ("model=carrera", 1), ("category=Sports", 1), ("min_price=100000&max_price=120000", 1), ("q=porsche", 1), ("make=toyota", 0), ("max_price=100", 0), ("make=%27%20OR%201%3D1--", 0)])
def test_search_filters(setup, query, expected):
    client, _ = setup
    auth = headers(client)
    add(client, auth)
    assert len(client.get(f"/api/vehicles/search?{query}", headers=auth).json()) == expected


@pytest.mark.parametrize("query", ["min_price=200&max_price=100", "min_price=-1", "max_price=NaN"])
def test_invalid_price_filters(setup, query):
    client, _ = setup
    assert client.get(f"/api/vehicles/search?{query}", headers=headers(client)).status_code == 422


def test_purchase_decrements_and_rejects_out_of_stock(setup):
    client, _ = setup
    auth = headers(client)
    vehicle = add(client, auth, quantity=1).json()
    url = f"/api/vehicles/{vehicle['id']}/purchase"
    assert client.post(url, headers=auth).json()["quantity"] == 0
    assert client.post(url, headers=auth).status_code == 409


def test_concurrent_purchases_cannot_oversell(setup):
    client, _ = setup
    auth = headers(client)
    vehicle = add(client, auth, quantity=1).json()
    with ThreadPoolExecutor(max_workers=4) as pool:
        statuses = list(pool.map(lambda _: client.post(f"/api/vehicles/{vehicle['id']}/purchase", headers=auth).status_code, range(4)))
    assert sorted(statuses) == [200, 409, 409, 409]


def test_admin_delete_and_restock(setup):
    client, path = setup
    admin = headers(client, path, True, "admin@example.com")
    user = headers(client)
    vehicle = add(client, admin).json()
    url = f"/api/vehicles/{vehicle['id']}"
    assert client.delete(url, headers=user).status_code == 403
    assert client.post(url + "/restock", headers=user, json={"quantity": 2}).status_code == 403
    assert client.post(url + "/restock", headers=admin, json={"quantity": 2}).json()["quantity"] == 5
    assert client.delete(url, headers=admin).status_code == 204
    assert client.get("/api/vehicles", headers=admin).json() == []


@pytest.mark.parametrize("quantity", [0, -1, 1.5, True, 1000001])
def test_restock_validation(setup, quantity):
    client, path = setup
    admin = headers(client, path, True)
    vehicle = add(client, admin).json()
    assert client.post(f"/api/vehicles/{vehicle['id']}/restock", headers=admin, json={"quantity": quantity}).status_code == 422


@pytest.mark.parametrize("method,suffix,body", [("put", "", CAR), ("delete", "", None), ("post", "/purchase", None), ("post", "/restock", {"quantity": 1})])
def test_missing_vehicle_returns_404(setup, method, suffix, body):
    client, path = setup
    auth = headers(client, path, True)
    assert client.request(method, f"/api/vehicles/999{suffix}", headers=auth, json=body).status_code == 404


def test_development_secret_survives_restart(tmp_path, monkeypatch):
    from backend import app
    monkeypatch.setattr(app, "ROOT", tmp_path)
    monkeypatch.delenv("JWT_SECRET", raising=False)
    first = app.local_secret()
    assert len(first) >= 32
    assert app.local_secret() == first
    assert (tmp_path / ".jwt-secret").stat().st_mode & 0o777 == 0o600


def test_configured_secret_requires_minimum_length(monkeypatch):
    from backend.app import local_secret
    monkeypatch.setenv("JWT_SECRET", "short")
    with pytest.raises(RuntimeError):
        local_secret()
    monkeypatch.setenv("JWT_SECRET", SECRET)
    assert local_secret() == SECRET


def test_health_checks_database(setup):
    client, _ = setup
    assert client.get("/api/health").json() == {"status": "ok"}


def test_deleted_user_token_is_rejected(setup):
    client, path = setup
    auth = headers(client)
    with sqlite3.connect(path) as db:
        db.execute("DELETE FROM users")
    assert client.get("/api/auth/me", headers=auth).status_code == 401
