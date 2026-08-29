const test = require('node:test');
const assert = require('node:assert/strict');

const products = [
  { nome: 'Cafeteira Elétrica', categoria: 'cozinha', categoria_label: 'Casa e Cozinha' },
  { nome: 'Fone Bluetooth', categoria: 'eletronicos', categoria_label: 'Eletrônicos' },
  { nome: 'Organizador de Gavetas', categoria: 'organizacao', categoria_label: 'Organização' }
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

  assert.equal(typeof filterProducts, 'function');
  assert.deepEqual(filterProducts(products, 'eletronicos', 'all'), [products[1]]);
  assert.deepEqual(filterProducts(products, 'organizacao', 'all'), [products[2]]);
});

test('combina a busca textual com a categoria selecionada', async () => {
  const { filterProducts } = await loadSearchModule();

  assert.equal(typeof filterProducts, 'function');
  assert.deepEqual(filterProducts(products, 'casa', 'cozinha'), [products[0]]);
  assert.deepEqual(filterProducts(products, 'fone', 'cozinha'), []);
});

test('mantém todos os produtos quando a busca está vazia', async () => {
  const { filterProducts } = await loadSearchModule();

  assert.equal(typeof filterProducts, 'function');
  assert.deepEqual(filterProducts(products, '   ', 'all'), products);
});
