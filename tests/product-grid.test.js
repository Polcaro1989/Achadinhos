const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const searchJs = fs.readFileSync(path.join(__dirname, '..', 'product-search.js'), 'utf8');

test('mantem quatro cards por fileira no desktop', () => {
  assert.match(html, /\.deal-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/s);
});

test('mostra tres cards por fileira no tablet', () => {
  assert.match(searchJs, /max-width:\s*1020px[\s\S]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
});

test('mostra dois cards por fileira no celular', () => {
  assert.match(searchJs, /max-width:\s*560px[\s\S]*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
});
