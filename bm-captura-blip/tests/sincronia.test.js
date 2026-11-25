const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const b = require('../build.js');

test('HTML em dist/ está em sincronia com src/ (rode npm run build)', () => {
  const arq = path.join(__dirname, '..', 'dist', b.nomeArquivo());
  assert.ok(fs.existsSync(arq), 'falta ' + b.nomeArquivo());
  assert.strictEqual(fs.readFileSync(arq, 'utf8'), b.montarInstalador());
});

test('favorito arrastável e "Copiar código" entregam exatamente o mesmo código', async () => {
  const { chromium } = require('playwright');
  const nav = await chromium.launch();
  const pg = await nav.newPage();
  await pg.goto('file://' + path.join(__dirname, '..', 'dist', b.nomeArquivo()));
  const href = await pg.getAttribute('#favorito', 'href');
  const caixa = await pg.inputValue('#codigo');
  await nav.close();
  assert.strictEqual(href, caixa);
  assert.strictEqual(href, b.montarHref(b.montarCodigo()));
});
