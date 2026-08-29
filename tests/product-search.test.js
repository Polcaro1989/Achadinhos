const test = require('node:test');
const assert = require('node:assert/strict');

const products = [
  { id: 'a1', nome: 'Cafeteira Elétrica', categoria: 'cozinha', categoria_label: 'Casa e Cozinha' },
  { id: 'b2', nome: 'Fone Bluetooth', categoria: 'eletronicos', categoria_label: 'Eletrônicos' },
  { id: 'c3', nome: 'Organizador de Gavetas', categoria: 'organizacao', categoria_label: 'Organização' }
];

async function loadSearchModule() {
  const loaded = await import('../product-search.js').catch(() => ({}));
  return loaded.default || loaded;
}

test('encontra produto ignorando maiúsculas e acentos', async () => {
  const { filterProducts } = await loadSearchModule();
  assert.equal(typeof filterProducts, 'function');
  assert.deepEqual(filterProducts(products, 'CAFETEIRA', 'all'), [products[0]]);
  assert.deepEqual(filterProducts(products, 'eletrica', 'all'), [products[0]]);
});

test('encontra produtos pelo nome visível da categoria', async () => {
  const { filterProducts } = await loadSearchModule();
  assert.deepEqual(filterProducts(products, 'eletronicos', 'all'), [products[1]]);
  assert.deepEqual(filterProducts(products, 'organizacao', 'all'), [products[2]]);
});

test('combina a busca textual com a categoria selecionada', async () => {
  const { filterProducts } = await loadSearchModule();
  assert.deepEqual(filterProducts(products, 'casa', 'cozinha'), [products[0]]);
  assert.deepEqual(filterProducts(products, 'fone', 'cozinha'), []);
});

test('mantém todos os produtos quando a busca está vazia', async () => {
  const { filterProducts } = await loadSearchModule();
  assert.deepEqual(filterProducts(products, '   ', 'all'), products);
});

test('deep link mostra somente o produto solicitado', async () => {
  const { filterProductsForView } = await loadSearchModule();
  assert.equal(typeof filterProductsForView, 'function');
  assert.deepEqual(filterProductsForView(products, '', 'all', 'b2'), [products[1]]);
});

test('deep link inexistente cai para a lista normal', async () => {
  const { filterProductsForView } = await loadSearchModule();
  assert.deepEqual(filterProductsForView(products, '', 'all', 'nao-existe'), products);
});
