import asyncio
import os
import random

from supabase import create_client
from telethon import TelegramClient
from telethon.errors import FloodWaitError
from telethon.sessions import StringSession


def env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise RuntimeError(f"missing_env:{name}")
    return value


def format_brl(value) -> str:
    try:
        number = float(value)
        return f"R$ {number:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    except Exception:
        return str(value or "")


def build_message(product: dict) -> str:
    badge = str(product.get("badge") or "").strip()
    name = " ".join(str(product.get("nome") or "").split())
    price = format_brl(product.get("preco_atual"))
    link = str(product.get("link_afiliado") or "").strip()
    return "\n".join([
        f"🔥 {badge}" if badge else "🔥 Achadinho do dia",
        "",
        f"🛍️ {name}",
        f"💰 {price}",
        "",
        f"👉 Comprar: {link}",
        "",
        "#achadinhos #ofertas #shopee",
    ])


async def resolve_target(client: TelegramClient, target: dict):
    username = str(target.get("username") or "").strip().lstrip("@")
    if username:
        return await client.get_entity(username)

    wanted = str(target.get("title") or "").strip().lower()
    async for dialog in client.iter_dialogs(limit=200):
        if str(dialog.name or "").strip().lower() == wanted:
            return dialog.entity
    raise RuntimeError(f"target_not_found:{target.get('key')}")


async def main() -> None:
    api_id = int(env("TELEGRAM_API_ID"))
    api_hash = env("TELEGRAM_API_HASH")
    db = create_client(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"))

    session_result = db.rpc("get_telegram_session_secret").execute()
    session = session_result.data
    if not session:
        raise RuntimeError("telegram_session_not_configured; run Telegram Auth workflow first")

    targets_result = (
        db.table("telegram_targets")
        .select("key,title,username,enabled")
        .eq("enabled", True)
        .order("created_at")
        .execute()
    )
    targets = targets_result.data or []
    if not targets:
        print("NO_ENABLED_TARGETS")
        return

    products_result = (
        db.table("achadinhos_produtos")
        .select("id,nome,badge,preco_atual,link_afiliado,imagem_url,ordem,ativo")
        .eq("ativo", True)
        .order("ordem")
        .limit(100)
        .execute()
    )
    products = products_result.data or []
    if not products:
        print("NO_PRODUCTS")
        return

    product_ids = [p["id"] for p in products]
    posts_result = (
        db.table("telegram_posts")
        .select("produto_id,grupo_key,status")
        .in_("produto_id", product_ids)
        .eq("status", "sent")
        .execute()
    )
    sent = {f"{r['produto_id']}:{r['grupo_key']}" for r in (posts_result.data or [])}

    product = next(
        (p for p in products if any(f"{p['id']}:{t['key']}" not in sent for t in targets)),
        None,
    )
    if not product:
        print("NO_PENDING_PRODUCT")
        return

    pending_targets = [t for t in targets if f"{product['id']}:{t['key']}" not in sent]
    message = build_message(product)

    client = TelegramClient(StringSession(str(session)), api_id, api_hash)
    await client.connect()
    if not await client.is_user_authorized():
        await client.disconnect()
        raise RuntimeError("telegram_session_not_authorized")

    for index, target in enumerate(pending_targets):
        try:
            entity = await resolve_target(client, target)
            sent_message = await client.send_message(entity, message, link_preview=True)
            db.table("telegram_posts").upsert({
                "produto_id": product["id"],
                "grupo_key": target["key"],
                "telegram_message_id": int(sent_message.id),
                "status": "sent",
                "error_message": None,
            }, on_conflict="produto_id,grupo_key").execute()
            print(f"SENT:{product['id']}:{target['key']}:{sent_message.id}")
        except FloodWaitError as exc:
            print(f"FLOOD_WAIT:{exc.seconds}")
            break
        except Exception as exc:
            db.table("telegram_posts").upsert({
                "produto_id": product["id"],
                "grupo_key": target["key"],
                "telegram_message_id": None,
                "status": "error",
                "error_message": str(exc)[:1000],
            }, on_conflict="produto_id,grupo_key").execute()
            print(f"ERROR:{target['key']}:{exc}")

        if index < len(pending_targets) - 1:
            await asyncio.sleep(random.randint(90, 150))

    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
