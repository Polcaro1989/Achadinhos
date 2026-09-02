import asyncio
import random
from dotenv import load_dotenv

from config import load_settings
from delivery import send_product
from repository import TelegramRepository


async def run_once() -> None:
    load_dotenv()
    settings = load_settings()

    from supabase import create_client
    from telethon import TelegramClient
    from telethon.errors import FloodWaitError

    repository = TelegramRepository(create_client(settings.supabase_url, settings.supabase_service_key))
    product, pending_groups = repository.next_product(settings.group_ids)
    if not product:
        print('Nenhum produto pendente para os grupos configurados.')
        return

    async with TelegramClient(settings.session_name, settings.api_id, settings.api_hash) as client:
        await client.start(phone=settings.phone)
        for index, group_id in enumerate(pending_groups):
            try:
                message_id = await send_product(client, group_id, product)
                repository.record_success(int(product['id']), group_id, message_id)
                print(f'Produto {product["id"]} enviado para {group_id} como mensagem {message_id}.')
            except FloodWaitError as exc:
                print(f'Telegram pediu espera de {exc.seconds}s; execução encerrada sem contornar o limite.')
                return
            if index < len(pending_groups) - 1:
                await asyncio.sleep(random.randint(settings.min_delay_seconds, settings.max_delay_seconds))


if __name__ == '__main__':
    asyncio.run(run_once())
