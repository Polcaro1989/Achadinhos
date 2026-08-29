const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const searchJs = fs.readFileSync(path.join(__dirname, '..', 'product-search.js'), 'utf8');
const fixesJs = fs.readFileSync(path.join(__dirname, '..', 'site-fixes.js'), 'utf8');

test('carrega complemento com versao para evitar cache antigo', () => {
  assert.match(searchJs, /site-fixes\.js\?v=/);
});

test('produto da URL recebe foco automatico', () => {
  assert.match(fixesJs, /new URLSearchParams\(window\.location\.search\)/);
  assert.match(fixesJs, /params\.get\(['"]produto['"]\)/);
  assert.match(fixesJs, /scrollIntoView\(/);
});

test('deep link identifica o card pelo mesmo link afiliado sem trocar o href do botao', () => {
  assert.match(fixesJs, /params\.get\(['"]afiliado['"]\)/);
  assert.match(fixesJs, /card\.querySelector\(['"]a\.cta['"]\)/);
  assert.doesNotMatch(fixesJs, /\.href\s*=(?!=)/);
});
