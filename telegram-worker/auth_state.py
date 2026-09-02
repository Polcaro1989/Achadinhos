import uuid


def generate_auth_token() -> str:
    return str(uuid.uuid4())
