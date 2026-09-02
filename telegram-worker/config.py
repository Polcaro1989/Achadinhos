import os
from dataclasses import dataclass
from core import parse_group_ids


@dataclass(frozen=True)
class Settings:
    api_id: int
    api_hash: str
    phone: str
    group_ids: list[int]
    supabase_url: str
    supabase_service_key: str
    min_delay_seconds: int
    max_delay_seconds: int
    session_name: str


def load_settings() -> Settings:
    required = [
        'TELEGRAM_API_ID', 'TELEGRAM_API_HASH', 'TELEGRAM_PHONE',
        'TELEGRAM_GROUP_IDS', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY'
    ]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError('Missing environment variables: ' + ', '.join(missing))
    minimum = int(os.getenv('TELEGRAM_MIN_DELAY_SECONDS', '60'))
    maximum = int(os.getenv('TELEGRAM_MAX_DELAY_SECONDS', '120'))
    if minimum < 0 or maximum < minimum:
        raise RuntimeError('Invalid Telegram delay range')
    return Settings(
        api_id=int(os.environ['TELEGRAM_API_ID']),
        api_hash=os.environ['TELEGRAM_API_HASH'],
        phone=os.environ['TELEGRAM_PHONE'],
        group_ids=parse_group_ids(os.environ['TELEGRAM_GROUP_IDS']),
        supabase_url=os.environ['SUPABASE_URL'],
        supabase_service_key=os.environ['SUPABASE_SERVICE_KEY'],
        min_delay_seconds=minimum,
        max_delay_seconds=maximum,
        session_name=os.getenv('TELEGRAM_SESSION_NAME', 'telegram_achadinhos'),
    )
