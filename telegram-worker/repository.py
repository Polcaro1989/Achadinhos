from core import pending_group_ids


def select_next_product(products: list[dict], history: list[dict], group_ids: list[int]):
    sent_by_product: dict[int, set[int]] = {}
    for row in history:
        sent_by_product.setdefault(int(row['produto_id']), set()).add(int(row['grupo_id']))
    for product in products:
        product_id = int(product['id'])
        pending = pending_group_ids(group_ids, sent_by_product.get(product_id, set()))
        if pending:
            return product, pending
    return None, []


class TelegramRepository:
    def __init__(self, client):
        self.client = client

    def fetch_candidate_products(self) -> list[dict]:
        response = (self.client.table('achadinhos_produtos')
                    .select('id,nome,preco_atual,imagem_url,link_afiliado,ordem')
                    .eq('ativo', True)
                    .order('ordem', desc=False)
                    .execute())
        return response.data or []

    def fetch_history(self) -> list[dict]:
        response = self.client.table('telegram_posts').select('produto_id,grupo_id').execute()
        return response.data or []

    def next_product(self, group_ids: list[int]):
        return select_next_product(self.fetch_candidate_products(), self.fetch_history(), group_ids)

    def record_success(self, produto_id: int, grupo_id: int, message_id: int) -> None:
        self.client.table('telegram_posts').upsert({
            'produto_id': produto_id,
            'grupo_id': grupo_id,
            'message_id': message_id,
            'status': 'enviado',
        }, on_conflict='produto_id,grupo_id').execute()
