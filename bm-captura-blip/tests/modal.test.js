// O painel precisa continuar clicável quando o Blip abre um modal (ex.: "Transferir atendimento").
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const b = require('../build.js');

test('painel continua clicável com modal aberto e volta ao lugar quando o modal fecha', async (t) => {
  const { chromium } = require('playwright');
  const nav = await chromium.launch();
  t.after(() => nav.close());
  const pg = await nav.newPage();
  await pg.goto('file://' + path.join(__dirname, 'pagina-falsa-blip.html'));
  const codigo = decodeURIComponent(b.montarHref(b.montarCodigo()).slice('javascript:'.length));
  await pg.evaluate(codigo);

  await pg.evaluate(() => document.getElementById('modal-transferir').abrir());
  await pg.waitForTimeout(800);

  const painel = pg.locator('#rb-captura-host');
  await painel.locator('.bcap').click({ timeout: 3000 });
  assert.match(await painel.locator('.log').textContent(), /Tela lida/);
  // o campo de texto também precisa aceitar digitação
  await painel.locator('.extras').fill('Lenize', { timeout: 3000 });
  assert.strictEqual(await painel.locator('.extras').inputValue(), 'Lenize');

  await pg.evaluate(() => document.getElementById('modal-transferir').fechar());
  await pg.waitForTimeout(800);
  assert.strictEqual(await pg.evaluate(() => document.getElementById('rb-captura-host').parentNode === document.documentElement), true);
  await painel.locator('.bcap').click({ timeout: 3000 });
});
