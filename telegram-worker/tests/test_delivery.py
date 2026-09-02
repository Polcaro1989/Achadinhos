import asyncio
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1]))

from delivery import send_product


class Message:
    id = 77


class FakeClient:
    def __init__(self): self.calls = []
    async def send_file(self, group_id, image, caption):
        self.calls.append(('file', group_id, image, caption)); return Message()
    async def send_message(self, group_id, message):
        self.calls.append(('text', group_id, message)); return Message()


def product(image=None):
    return {'nome': 'Oferta', 'preco_atual': 10, 'link_afiliado': 'https://example.com/a', 'imagem_url': image}


def test_send_product_uses_image_when_available():
    client = FakeClient()
    message_id = asyncio.run(send_product(client, -1001, product('https://img/x.jpg')))
    assert message_id == 77
    assert client.calls[0][0] == 'file'


def test_send_product_falls_back_to_text_without_image():
    client = FakeClient()
    asyncio.run(send_product(client, -1001, product()))
    assert client.calls[0][0] == 'text'
