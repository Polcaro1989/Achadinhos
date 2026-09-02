import uuid

from auth_state import generate_auth_token


def test_generate_auth_token_returns_postgres_uuid():
    value = generate_auth_token()
    parsed = uuid.UUID(value)
    assert str(parsed) == value
