import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1]))

from repository import select_next_product


def test_select_next_product_uses_oldest_product_with_pending_group():
    products = [
        {'id': 10, 'nome': 'Primeiro', 'ordem': 1},
        {'id': 20, 'nome': 'Segundo', 'ordem': 2},
    ]
    history = [
        {'produto_id': 10, 'grupo_id': -1001},
        {'produto_id': 10, 'grupo_id': -1002},
        {'produto_id': 20, 'grupo_id': -1001},
    ]
    product, pending = select_next_product(products, history, [-1001, -1002])
    assert product['id'] == 20
    assert pending == [-1002]


def test_select_next_product_returns_none_when_every_group_received_every_product():
    products = [{'id': 10, 'ordem': 1}]
    history = [
        {'produto_id': 10, 'grupo_id': -1001},
        {'produto_id': 10, 'grupo_id': -1002},
    ]
    assert select_next_product(products, history, [-1001, -1002]) == (None, [])
