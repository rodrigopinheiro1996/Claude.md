const test = require('node:test');
const assert = require('node:assert');
const p = require('../src/puras.js');

const m = (s, o) => p.rbMascararTexto(s, o);

test('telefones e CPF viram números fictícios, mantendo o formato', () => {
  assert.strictEqual(m('88993505390 ; 85996918465'), '12345678901 ; 12345678901');
  assert.strictEqual(m('CPF 123.456.789-09'), 'CPF 123.456.789-01');
  assert.strictEqual(m('(85) 99691-8465'), '(12) 34567-8901');
});

test('números curtos e horários ficam (contadores, hora)', () => {
  assert.strictEqual(m('12 conversas às 10:32'), '12 conversas às 10:32');
});

test('e-mail vira fulano@exemplo.com', () => {
  assert.strictEqual(m('contato: joao.silva@gmail.com'), 'contato: fulano@exemplo.com');
});

test('nome comum vira Nome Fictício, inclusive em maiúsculas e com sobrenome', () => {
  assert.strictEqual(m('Maria da Silva Souza'), 'Nome Fictício');
  assert.strictEqual(m('Olá, JOSÉ CARLOS DE OLIVEIRA!'), 'Olá, NOME FICTÍCIO!');
  assert.strictEqual(m('Atendente Rodrigo Pinheiro'), 'Atendente Nome Fictício');
});

test('textos da tela não são mexidos', () => {
  for (const s of ['Resposta Privada', 'Já está em atendimento', 'Enviar', 'Mensagens Ativas', 'Transferir']) {
    assert.strictEqual(m(s), s);
  }
});

test('extras do painel e revisão escondem o que a regra automática não pegou', () => {
  assert.strictEqual(m('Kleber Nogueira', { extras: ['kleber'] }), 'Oculto Nogueira');
  assert.strictEqual(m('Cliente: Kleber Nogueira', { esconder: { 'Kleber Nogueira': true } }), 'Cliente: Nome Fictício');
});

test('mensagem longa é escondida quando a opção está ligada', () => {
  const longa = 'Bom dia, estou com problema no meu cartão desde ontem e ninguém resolve, quero cancelar tudo agora mesmo';
  assert.match(m(longa, { textoLongo: true }), /^\[mensagem oculta: \d+ caracteres\]$/);
  assert.strictEqual(m('Este contato já está em atendimento', { textoLongo: true }), 'Este contato já está em atendimento');
});

test('candidatos: sequências com maiúscula que podem ser nome', () => {
  assert.deepStrictEqual(p.rbCandidatos('Cliente Kleber Nogueira abriu'), ['Cliente Kleber Nogueira']);
  assert.deepStrictEqual(p.rbCandidatos('Nome Fictício'), []);
});

test('montar arquivo: sombra vira template, css vai separado, texto mascarado e escapado', () => {
  const arv = { t: 'doc', html: { t: 'el', tag: 'html', attrs: [], kids: [
    { t: 'el', tag: 'head', attrs: [], kids: [] },
    { t: 'el', tag: 'body', attrs: [], kids: [
      { t: 'el', tag: 'bds-button', attrs: [['id', 'b1'], ['title', 'Ligar 85996918465']], kids: [{ t: 'text', v: 'Enviar <já>' }],
        sombra: { css: [0], kids: [{ t: 'el', tag: 'button', attrs: [], kids: [{ t: 'el', tag: 'slot', attrs: [], kids: [] }] }] } }
    ] }
  ] } };
  const html = p.rbMontarArquivo(arv, ['button{color:red}'], { versao: 'x' }, {});
  assert.match(html, /<bds-button id="b1" title="Ligar 12345678901"><template shadowrootmode="open"><style data-rb-css="0"><\/style><button><slot><\/slot><\/button><\/template>Enviar &lt;já&gt;<\/bds-button>/);
  assert.match(html, /<script type="application\/json" id="rb-css">\["button\{color:red\}"\]<\/script>/);
  assert.match(html, /<meta name="rodbot-captura"/);
});

// ---- Vazamentos encontrados nas capturas reais do Blip (25/11). Dados abaixo são FICTÍCIOS. ----
const arvoreCom = (body) => ({ t: 'doc', html: { t: 'el', tag: 'html', attrs: [], kids: [
  { t: 'el', tag: 'head', attrs: [], kids: [] }, { t: 'el', tag: 'body', attrs: [], kids: body }] } });

test('nome de uma palavra só no "Ticket 123 - Nome" vira candidato e some de todo o arquivo', () => {
  const arv = arvoreCom([
    { t: 'el', tag: 'article', attrs: [['aria-label', 'Ticket 1112223 - Zuleidex']], kids: [] },
    { t: 'el', tag: 'span', attrs: [['id', 'customer-name']], kids: [{ t: 'text', v: 'Zuleidex' }] },
    { t: 'el', tag: 'p', attrs: [], kids: [{ t: 'text', v: 'Zuleidexa é outra palavra' }] }
  ]);
  const cand = p.rbJuntarCandidatos(arv, {});
  assert.ok(cand.includes('Zuleidex'), 'candidatos: ' + cand);
  const html = p.rbMontarArquivo(arv, [], {}, { esconder: { Zuleidex: true } });
  assert.ok(!/Zuleidex[^a]/.test(html), 'sobrou o nome');
  assert.match(html, /Zuleidexa é outra palavra/, 'não pode cortar pedaço de outra palavra');
});

test('"Nome: Fulano" no resumo do ticket vira candidato', () => {
  const arv = arvoreCom([{ t: 'el', tag: 'p', attrs: [], kids: [
    { t: 'el', tag: 'b', attrs: [], kids: [{ t: 'text', v: 'Nome:' }] }, { t: 'text', v: ' Zuleidex' }] },
    { t: 'el', tag: 'p', attrs: [], kids: [{ t: 'text', v: 'Nome: Quelvia' }] }]);
  const cand = p.rbJuntarCandidatos(arv, {});
  assert.ok(cand.includes('Zuleidex') && cand.includes('Quelvia'), 'candidatos: ' + cand);
});

test('atributo name de avatar (bds-avatar) é mascarado; name de campo de formulário não', () => {
  const arv = arvoreCom([
    { t: 'el', tag: 'bds-avatar', attrs: [['name', 'Zuleidex Quelvia']], kids: [] },
    { t: 'el', tag: 'input', attrs: [['name', 'Telefone Celular']], kids: [] }]);
  const cand = p.rbJuntarCandidatos(arv, {});
  assert.ok(cand.includes('Zuleidex Quelvia'));
  const html = p.rbMontarArquivo(arv, [], {}, { esconder: { 'Zuleidex Quelvia': true } });
  assert.match(html, /<bds-avatar name="Nome Fictício">/);
  assert.match(html, /<input name="Telefone Celular">/);
});

test('id de mensagem do WhatsApp (wamid, tem o telefone codificado) é trocado, mantendo ids diferentes', () => {
  // base64 de "551234567890" (telefone fictício) = NTUxMjM0NTY3ODkw
  const a = 'wamid.HBgMNTUxMjM0NTY3ODkwFQIAEhgWM0VBQUFBQUFBQUFBQUFBQUFBQUFBAA=';
  const b2 = 'wamid.HBgMNTUxMjM0NTY3ODkwFQIAEhgWM0VCQkJCQkJCQkJCQkJCQkJCQkJCAA=';
  const arv = arvoreCom([
    { t: 'el', tag: 'div', attrs: [['id', a]], kids: [] },
    { t: 'el', tag: 'div', attrs: [['id', b2]], kids: [] },
    { t: 'el', tag: 'a', attrs: [['href', '#' + a]], kids: [] }]);
  const html = p.rbMontarArquivo(arv, [], {}, {});
  assert.ok(!html.includes('NTUxMjM0NTY3ODkw'), 'sobrou o telefone codificado');
  const ids = [...html.matchAll(/id="(wamid\.[^"]+)"/g)].map(m => m[1]);
  assert.strictEqual(ids.length, 2);
  assert.notStrictEqual(ids[0], ids[1]);
  assert.ok(html.includes('href="#' + ids[0] + '"'), 'o mesmo id deve virar o mesmo texto');
});
