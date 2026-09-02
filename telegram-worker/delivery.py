from core import format_product_message


async def send_product(client, group_id: int, product: dict) -> int:
    message = format_product_message(product)
    image = str(product.get('imagem_url') or '').strip()
    if image:
        sent = await client.send_file(group_id, image, caption=message)
    else:
        sent = await client.send_message(group_id, message)
    return int(sent.id)
