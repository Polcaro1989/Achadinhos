const test = require('node:test');
const assert = require('node:assert/strict');

async function loadCatalogModule() {
  const loaded = await import('../supabase/functions/pinterest-rss/catalog_logic.mjs').catch(() => ({}));
  return loaded.default || loaded;
}

const product = {
  id: 'produto-1',
  nome: 'Conjunto Camiseta Bermuda Up Baby',
  categoria: 'infantil',
  categoria_label: 'Infantil',
  imagem_url: 'https://example.com/produto.jpg',
  link_afiliado: 'https://s.shopee.com.br/abc123',
  preco_atual: 69.96,
  preco_antigo: 139.90,
  avaliacao: 5,
  vendas: '300+ vendidos',
  beneficio: 'Conjunto confortável para crianças',
  badge: '50% OFF',
  ativo: true,
  criado_em: '2026-08-29T00:00:00Z'
};

test('usa diretamente o link de afiliado como destino do produto', async () => {
  const { renderCatalogItem } = await loadCatalogModule();

  assert.equal(typeof renderCatalogItem, 'function');
  const xml = renderCatalogItem(product);
  assert.match(xml, /<link>https:\/\/s\.shopee\.com\.br\/abc123<\/link>/);
  assert.match(xml, /<g:mobile_link>https:\/\/s\.shopee\.com\.br\/abc123<\/g:mobile_link>/);
  assert.doesNotMatch(xml, /polcaro1989\.github\.io/);
});

test('inclui o preço atual também na descrição visível', async () => {
  const { renderCatalogItem } = await loadCatalogModule();

  assert.equal(typeof renderCatalogItem, 'function');
  const xml = renderCatalogItem(product);
  assert.match(xml, /Preço atual: R\$ 69,96/);
  assert.match(xml, /<g:price>139\.90 BRL<\/g:price>/);
  assert.match(xml, /<g:sale_price>69\.96 BRL<\/g:sale_price>/);
});

test('envia avaliação e detalhes adicionais compatíveis com o catálogo', async () => {
  const { renderCatalogItem } = await loadCatalogModule();

  assert.equal(typeof renderCatalogItem, 'function');
  const xml = renderCatalogItem(product);
  assert.match(xml, /<g:average_review_rating>5<\/g:average_review_rating>/);
  assert.match(xml, /<g:product_type>Infantil<\/g:product_type>/);
  assert.match(xml, /<g:alt_text>Conjunto Camiseta Bermuda Up Baby<\/g:alt_text>/);
  assert.match(xml, /<g:custom_label_0>50% OFF<\/g:custom_label_0>/);
  assert.match(xml, /<g:adult>false<\/g:adult>/);
});

test('rejeita produto sem link de afiliado', async () => {
  const { isCatalogProduct } = await loadCatalogModule();

  assert.equal(typeof isCatalogProduct, 'function');
  assert.equal(isCatalogProduct({ ...product, link_afiliado: '' }), false);
});
