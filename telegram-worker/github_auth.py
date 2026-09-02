import asyncio
import os
from datetime import datetime, timedelta, timezone

from supabase import create_client
from telethon import TelegramClient
from telethon.errors import SessionPasswordNeededError
from telethon.sessions import StringSession


def env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"missing_env:{name}")
    return value


def supabase_client():
    return create_client(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))


async def send_code() -> None:
    api_id = int(env("TELEGRAM_API_ID"))
    api_hash = env("TELEGRAM_API_HASH")
    phone = env("TELEGRAM_PHONE")

    db = supabase_client()
    client = TelegramClient(StringSession(), api_id, api_hash)
    await client.connect()
    sent = await client.send_code_request(phone)
    temp_session = client.session.save()
    await client.disconnect()

    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    db.table("telegram_auth_pending").delete().eq("phone", phone).execute()
    db.table("telegram_auth_pending").insert({
        "token": os.urandom(16).hex(),
        "phone": phone,
        "phone_code_hash": sent.phone_code_hash,
        "temp_session": temp_session,
        "needs_password": False,
        "expires_at": expires_at,
    }).execute()
    print("CODE_SENT")


async def verify_code() -> None:
    api_id = int(env("TELEGRAM_API_ID"))
    api_hash = env("TELEGRAM_API_HASH")
    phone = env("TELEGRAM_PHONE")
    code = env("TELEGRAM_LOGIN_CODE")
    password = os.getenv("TELEGRAM_2FA_PASSWORD", "")

    db = supabase_client()
    result = (
        db.table("telegram_auth_pending")
        .select("token,phone,phone_code_hash,temp_session,expires_at")
        .eq("phone", phone)
        .order("expires_at", desc=True)
        .limit(1)
        .execute()
    )
    if not result.data:
        raise RuntimeError("auth_state_not_found; execute send_code first")

    pending = result.data[0]
    expires_at = datetime.fromisoformat(pending["expires_at"].replace("Z", "+00:00"))
    if expires_at <= datetime.now(timezone.utc):
        raise RuntimeError("auth_state_expired; execute send_code again")

    client = TelegramClient(StringSession(pending["temp_session"]), api_id, api_hash)
    await client.connect()
    try:
        await client.sign_in(
            phone=phone,
            code=code,
            phone_code_hash=pending["phone_code_hash"],
        )
    except SessionPasswordNeededError:
        if not password:
            await client.disconnect()
            raise RuntimeError("2FA_REQUIRED:add TELEGRAM_2FA_PASSWORD to GitHub Secrets")
        await client.sign_in(password=password)

    me = await client.get_me()
    session = client.session.save()
    await client.disconnect()

    rpc_result = db.rpc("set_telegram_session_secret", {"p_session": session}).execute()
    db.table("telegram_auth_pending").delete().eq("phone", phone).execute()
    print(f"AUTHORIZED:{getattr(me, 'username', None) or getattr(me, 'first_name', '')}")
    if getattr(rpc_result, "data", None) is not None:
        print("SESSION_SAVED_TO_SUPABASE")


async def main() -> None:
    action = os.getenv("TELEGRAM_AUTH_ACTION", "send_code").strip().lower()
    if action == "send_code":
        await send_code()
    elif action == "verify_code":
        await verify_code()
    else:
        raise RuntimeError(f"invalid_action:{action}")


if __name__ == "__main__":
    asyncio.run(main())
