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
