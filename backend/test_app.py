import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_ping(client):
    resp = client.get('/ping')
    assert resp.status_code == 200
    assert resp.get_json() == {"message": "pong"}

def test_price(client):
    resp = client.get('/price')
    assert resp.status_code == 200
    data = resp.get_json()
    assert "bitcoin" in data
    assert "ethereum" in data

def test_register_login_profile(client):
    # Register
    payload = {
        "email": "testuser2@example.com",
        "username": "testuser2",
        "password": "testpass123"
    }
    resp = client.post('/auth/register', json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert "token" in data
    assert data["user"]["email"] == payload["email"]

    # Login
    login_payload = {
        "email": "testuser2@example.com",
        "password": "testpass123"
    }
    resp = client.post('/auth/login', json=login_payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "token" in data
    token = data["token"]

    # Profile (protected)
    headers = {"Authorization": f"Bearer {token}"}
    resp = client.get('/auth/profile', headers=headers)
    assert resp.status_code == 200
    profile = resp.get_json()
    assert profile["email"] == "testuser2@example.com"

def test_register_duplicate(client):
    payload = {
        "email": "dupe@example.com",
        "username": "dupeuser",
        "password": "testpass123"
    }
    client.post('/auth/register', json=payload)
    resp = client.post('/auth/register', json=payload)
    assert resp.status_code == 409
    assert "error" in resp.get_json()

def test_login_invalid(client):
    payload = {
        "email": "notarealuser@example.com",
        "password": "wrongpass"
    }
    resp = client.post('/auth/login', json=payload)
    assert resp.status_code == 401
    assert "error" in resp.get_json()

def test_predict_requires_auth(client):
    resp = client.get('/predict')
    assert resp.status_code == 401
    assert "error" in resp.get_json()

def test_sentiment_requires_auth(client):
    resp = client.get('/sentiment')
    assert resp.status_code == 401
    assert "error" in resp.get_json()

def test_recommendation_requires_auth(client):
    resp = client.get('/recommendation')
    assert resp.status_code == 401
    assert "error" in resp.get_json()

def test_historical_requires_auth(client):
    resp = client.get('/historical')
    assert resp.status_code == 401
    assert "error" in resp.get_json()

def test_predict_sentiment_recommendation_historical(client):
    # Register and login to get token
    payload = {
        "email": "apitest@example.com",
        "username": "apitest",
        "password": "testpass123"
    }
    client.post('/auth/register', json=payload)
    login_payload = {
        "email": "apitest@example.com",
        "password": "testpass123"
    }
    resp = client.post('/auth/login', json=login_payload)
    token = resp.get_json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # /predict
    resp = client.get('/predict', headers=headers)
    assert resp.status_code in (200, 503)  # 503 if external API fails

    # /sentiment
    resp = client.get('/sentiment', headers=headers)
    assert resp.status_code == 200 or resp.status_code == 500

    # /recommendation
    resp = client.get('/recommendation', headers=headers)
    assert resp.status_code in (200, 503, 500)

    # /historical
    resp = client.get('/historical', headers=headers)
    assert resp.status_code in (200, 503, 500)

def test_test_reddit(client):
    resp = client.get('/test_reddit')
    assert resp.status_code == 200
    assert isinstance(resp.get_json(), list)

def test_cache_status(client):
    resp = client.get('/cache/status')
    assert resp.status_code == 200
    data = resp.get_json()
    assert "total_entries" in data
    assert "cache_types" in data