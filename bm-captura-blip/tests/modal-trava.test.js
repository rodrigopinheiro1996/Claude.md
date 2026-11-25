// Modal que intercepta os cliques fora dele (caso do "Transferir atendimento" no Blip real:
// o painel aparece por cima, mas clicar nele não faz nada).
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const b = require('../build.js');

test('com modal que intercepta cliques, o painel continua funcionando inteiro', async (t) => {
  const { chromium } = require('playwright');
  const nav = await chromium.launch();
  t.after(() => nav.close());
  const ctx = await nav.newContext({ acceptDownloads: true });
  const pg = await ctx.newPage();
  await pg.goto('file://' + path.join(__dirname, 'pagina-falsa-blip.html'));
  await pg.evaluate(decodeURIComponent(b.montarHref(b.montarCodigo()).slice('javascript:'.length)));
  await pg.evaluate(() => document.getElementById('modal-trava').abrir());
  const painel = pg.locator('#rb-captura-host');

  // digitar no campo
  await painel.locator('.extras').click();
  await pg.keyboard.type('Lenize');
  assert.strictEqual(await painel.locator('.extras').inputValue(), 'Lenize');

  // marcar a caixinha
  const antes = await painel.locator('.longo').isChecked();
  await painel.locator('.longo').click();
  assert.strictEqual(await painel.locator('.longo').isChecked(), !antes);

  // capturar: a captura precisa incluir o modal aberto
  await painel.locator('.bcap').click();
  assert.match(await painel.locator('.log').textContent(), /Tela lida/);

  // baixar
  const [down] = await Promise.all([pg.waitForEvent('download', { timeout: 3000 }), painel.locator('.bbaixar').click()]);
  assert.match(down.suggestedFilename(), /^captura-blip-/);

  // minimizar
  await painel.locator('.bmin').click();
  assert.match(await painel.locator('.p').getAttribute('class'), /min/);
  await painel.locator('.bmin').click();

  // arrastar pela barra
  const r0 = await pg.locator('#rb-captura-host').boundingBox();
  await pg.mouse.move(r0.x + 40, r0.y + 12);
  await pg.mouse.down();
  await pg.mouse.move(r0.x - 200, r0.y + 112, { steps: 5 });
  await pg.mouse.up();
  const r1 = await pg.locator('#rb-captura-host').boundingBox();
  assert.ok(Math.abs(r1.x - (r0.x - 240)) < 5 || r1.x < r0.x - 150, 'painel devia ter sido arrastado');

  // o modal do site continua funcionando para cliques dentro dele
  const cancelarOk = await pg.evaluate(() => {
    const m = document.getElementById('modal-trava');
    let ok = false;
    m.shadowRoot.getElementById('cancelar').addEventListener('click', () => { ok = true; });
    m.shadowRoot.getElementById('cancelar').click();
    return ok;
  });
  assert.strictEqual(cancelarOk, true);

  // fechar o painel tira as proteções
  await painel.locator('.bfec').click();
  assert.strictEqual(await pg.locator('#rb-captura-host').count(), 0);
});
