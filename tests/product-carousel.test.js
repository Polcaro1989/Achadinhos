const test = require('node:test');
const assert = require('node:assert/strict');

async function loadCarouselModule() {
  const loaded = await import('../product-carousel.js').catch(() => ({}));
  return loaded.default || loaded;
}

test('seleciona no máximo quatro produtos pela prioridade de ordem', async () => {
  const { selectFeaturedProducts } = await loadCarouselModule();
  const products = [
    { id: 5, ordem: 5 },
    { id: 2, ordem: 2 },
    { id: 1, ordem: 1 },
    { id: 4, ordem: 4 },
    { id: 3, ordem: 3 }
  ];

  assert.equal(typeof selectFeaturedProducts, 'function');
  assert.deepEqual(selectFeaturedProducts(products).map(product => product.id), [1, 2, 3, 4]);
});

test('avança e retorna ao início ao chegar no último slide', async () => {
  const { getNextSlideIndex } = await loadCarouselModule();

  assert.equal(typeof getNextSlideIndex, 'function');
  assert.equal(getNextSlideIndex(2, 1, 4), 3);
  assert.equal(getNextSlideIndex(3, 1, 4), 0);
});

test('volta e retorna ao último slide ao sair do início', async () => {
  const { getNextSlideIndex } = await loadCarouselModule();

  assert.equal(typeof getNextSlideIndex, 'function');
  assert.equal(getNextSlideIndex(1, -1, 4), 0);
  assert.equal(getNextSlideIndex(0, -1, 4), 3);
});

test('mantém índice zero quando não existem slides', async () => {
  const { getNextSlideIndex } = await loadCarouselModule();

  assert.equal(typeof getNextSlideIndex, 'function');
  assert.equal(getNextSlideIndex(3, 1, 0), 0);
});
