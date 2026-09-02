import asyncio
from dotenv import load_dotenv
from config import load_settings


async def main() -> None:
    load_dotenv()
    settings = load_settings()
    from telethon import TelegramClient
    client = TelegramClient(settings.session_name, settings.api_id, settings.api_hash)
    await client.start(phone=settings.phone)
    me = await client.get_me()
    print(f'Conta autenticada: {me.first_name} (id={me.id})')
    await client.disconnect()


if __name__ == '__main__':
    asyncio.run(main())
