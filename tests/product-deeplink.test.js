const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('vitrine possui fallback local quando ProductSearch externo nao estiver disponivel', () => {
  assert.match(html, /function\s+filterVisibleProducts\s*\(/);
  assert.match(html, /typeof\s+ProductSearch\s*!==\s*['"]undefined['"]/);
  assert.match(html, /filterVisibleProducts\(allProducts,\s*searchTerm,\s*activeCategory\)/);
});

test('produto da URL recebe id no card e foco automatico', () => {
  assert.match(html, /new\s+URLSearchParams\(window\.location\.search\)\.get\(['"]produto['"]\)/);
  assert.match(html, /card\.dataset\.productId\s*=\s*String\(p\.id\)/);
  assert.match(html, /scrollIntoView\(/);
});

test('script de busca usa versao para evitar cache antigo', () => {
  assert.match(html, /product-search\.js\?v=/);
});
