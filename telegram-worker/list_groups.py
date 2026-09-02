import asyncio
from dotenv import load_dotenv
from config import load_settings


async def main() -> None:
    load_dotenv()
    settings = load_settings()
    from telethon import TelegramClient
    async with TelegramClient(settings.session_name, settings.api_id, settings.api_hash) as client:
        await client.start(phone=settings.phone)
        async for dialog in client.iter_dialogs():
            if dialog.is_group:
                username = getattr(dialog.entity, 'username', None)
                print(f'{dialog.name} | id={dialog.id} | username={username}')


if __name__ == '__main__':
    asyncio.run(main())
