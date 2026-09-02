import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1]))

from core import format_product_message, parse_group_ids, pending_group_ids


def test_parse_group_ids_trims_and_deduplicates():
    assert parse_group_ids(' -1002, -1001, -1002 ') == [-1002, -1001]


def test_format_product_message_uses_existing_product_fields():
    message = format_product_message({
        'nome': 'Fone Bluetooth',
        'preco_atual': 29.9,
        'link_afiliado': 'https://s.shopee.com.br/abc',
    })
    assert '🔥 Fone Bluetooth' in message
    assert 'R$ 29,90' in message
    assert 'https://s.shopee.com.br/abc' in message


def test_pending_group_ids_excludes_already_sent_groups():
    assert pending_group_ids([-1001, -1002], {-1001}) == [-1002]
