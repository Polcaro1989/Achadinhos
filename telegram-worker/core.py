from decimal import Decimal, InvalidOperation


def parse_group_ids(raw: str) -> list[int]:
    result: list[int] = []
    seen: set[int] = set()
    for part in raw.split(','):
        value = part.strip()
        if not value:
            continue
        group_id = int(value)
        if group_id not in seen:
            seen.add(group_id)
            result.append(group_id)
    if not result:
        raise ValueError('TELEGRAM_GROUP_IDS must contain at least one group id')
    return result


def _brl(value) -> str:
    try:
        amount = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise ValueError('preco_atual must be numeric') from exc
    formatted = f'{amount:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    return f'R$ {formatted}'


def format_product_message(product: dict) -> str:
    name = str(product.get('nome') or '').strip()
    link = str(product.get('link_afiliado') or '').strip()
    if not name or not link:
        raise ValueError('product requires nome and link_afiliado')
    return f'🔥 {name}\n\n💰 {_brl(product.get("preco_atual"))}\n\n🛒 Comprar:\n{link}'


def pending_group_ids(group_ids: list[int], sent_group_ids: set[int]) -> list[int]:
    return [group_id for group_id in group_ids if group_id not in sent_group_ids]
