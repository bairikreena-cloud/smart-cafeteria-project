def test_register_customer_success(client):
    response = client.post("/api/auth/register", json={
        "full_name": "Jordan Doe",
        "email": "jordan.doe@campus.edu",
        "student_staff_id": "STU-9921",
        "password": "mypassword123",
        "role_name": "customer"
    })
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == "jordan.doe@campus.edu"
    assert data["role_name"] == "customer"

def test_register_duplicate_email_fails(client):
    payload = {
        "full_name": "Duplicate Test",
        "email": "student@campus.edu", # already seeded
        "password": "mypassword123",
        "role_name": "customer"
    }
    response = client.post("/api/auth/register", json=payload)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"]

def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "email": "student@campus.edu",
        "password": "testpass123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "student@campus.edu"

def test_login_invalid_credentials_fails(client):
    response = client.post("/api/auth/login", json={
        "email": "student@campus.edu",
        "password": "wrong_password"
    })
    assert response.status_code == 401
