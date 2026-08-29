const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('mantem quatro cards por fileira no desktop', () => {
  assert.match(html, /\.deal-grid\s*\{[^}]*grid-template-columns:\s*repeat\(4,\s*1fr\)/s);
});

test('mostra tres cards por fileira no tablet', () => {
  assert.match(html, /@media\s*\(max-width:\s*1020px\)\s*\{\s*\.deal-grid\s*\{\s*grid-template-columns:\s*repeat\(3,\s*1fr\)/s);
});

test('mostra dois cards por fileira no celular', () => {
  assert.match(html, /@media\s*\(max-width:\s*560px\)\s*\{\s*\.deal-grid\s*\{\s*grid-template-columns:\s*repeat\(2,\s*1fr\)/s);
});
