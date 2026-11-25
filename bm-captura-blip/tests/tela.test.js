// Teste de tela: roda o BM (pelo código do favorito) na página falsa do Blip,
// baixa a captura e abre o arquivo para conferir o resultado.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const b = require('../build.js');

test('captura atravessa Shadow DOM, mascara dados e gera arquivo que reabre igual', async (t) => {
  const { chromium } = require('playwright');
  const nav = await chromium.launch();
  t.after(() => nav.close());
  const ctx = await nav.newContext({ acceptDownloads: true });
  const pg = await ctx.newPage();
  const erros = []; pg.on('pageerror', e => erros.push(e.message));
  await pg.goto('file://' + path.join(__dirname, 'pagina-falsa-blip.html'));
  await pg.waitForFunction(() => document.getElementById('quadro').contentDocument.getElementById('dentro'));

  const codigo = decodeURIComponent(b.montarHref(b.montarCodigo()).slice('javascript:'.length));
  await pg.evaluate(codigo);
  await pg.evaluate(codigo); // 2x não abre 2 painéis
  assert.strictEqual(await pg.locator('#rb-captura-host').count(), 1);

  const painel = pg.locator('#rb-captura-host');
  await painel.locator('.bcap').click();
  const rev = await painel.locator('.lista label').allTextContents();
  assert.ok(rev.some(t => t.includes('Kleber Nogueira')), 'Kleber Nogueira devia aparecer na revisão: ' + rev);
  assert.ok(rev.some(t => t.includes('Resposta Privada')));
  // Desmarca o texto da tela, mantém o nome marcado
  await painel.locator('.lista label', { hasText: 'Resposta Privada' }).locator('input').uncheck();

  const [down] = await Promise.all([pg.waitForEvent('download'), painel.locator('.bbaixar').click()]);
  assert.match(down.suggestedFilename(), /^captura-blip-\d{4}-\d\d-\d\d-\d\dh\d\dm\d\d\.html$/);
  const arq = path.join(require('os').tmpdir(), 'rb-teste-' + Date.now() + '.html');
  await down.saveAs(arq);
  const html = fs.readFileSync(arq, 'utf8');
  if (process.env.SALVAR) fs.writeFileSync(process.env.SALVAR, html);

  // Nenhum dado fictício "de cliente" pode sobrar
  for (const s of ['Maria', 'Kleber', 'Nogueira', '88993505390', '85996918465', 'kleber.n@gmail.com', '123.456.789-09', 'João', 'Rodrigo Pinheiro']) {
    assert.ok(!html.includes(s), 'sobrou no arquivo: ' + s);
  }
  assert.ok(!html.includes('rb-captura-host'), 'o painel não pode entrar na captura');
  assert.ok(!html.includes('<script>  const folha'), 'scripts da página não entram');

  // Reabre o arquivo e confere: sombras, slot, css, iframe, visibilidade
  const pg2 = await ctx.newPage();
  await pg2.goto('file://' + arq);
  const r = await pg2.evaluate(() => {
    const btn = document.getElementById('enviar');
    const interno = btn.shadowRoot && btn.shadowRoot.querySelector('button');
    const slot = interno && interno.querySelector('slot');
    return {
      temSombra: !!interno,
      textoSlot: slot ? slot.assignedNodes().map(n => n.textContent).join('') : null,
      cor: interno ? getComputedStyle(interno).color : null,
      aviso: document.querySelector('.aviso bds-typo').shadowRoot.querySelector('slot').assignedNodes()[0].textContent,
      escondidoVisivel: document.getElementById('escondido').getAttribute('data-rb-visivel'),
      enviarVisivel: btn.getAttribute('data-rb-visivel'),
      rect: btn.getAttribute('data-rb-rect'),
      busca: document.getElementById('busca').value,
      iframe: document.getElementById('quadro').getAttribute('srcdoc'),
      meta: JSON.parse(document.querySelector('meta[name=rodbot-captura]').content)
    };
  });

  assert.deepStrictEqual(erros, []);
  assert.strictEqual(r.temSombra, true);
  assert.strictEqual(r.textoSlot, 'Resposta Privada');
  assert.strictEqual(r.cor, 'rgb(255, 0, 0)');
  assert.strictEqual(r.aviso, 'Este contato já está em atendimento');
  assert.strictEqual(r.escondidoVisivel, '0');
  assert.strictEqual(r.enviarVisivel, '1');
  assert.match(r.rect, /^\d+,\d+,\d+,\d+$/);
  assert.strictEqual(r.busca, 'Nome Fictício 12345678901');
  assert.match(r.iframe, /CPF 123\.456\.789-01/);
  assert.strictEqual(r.meta.versao, '1.0.2');
  assert.ok(r.meta.info.sombras >= 5);
});
