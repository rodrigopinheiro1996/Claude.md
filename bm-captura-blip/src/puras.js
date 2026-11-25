// Funções puras (sem DOM): máscara de dados pessoais e montagem do arquivo HTML.
// Testadas no Node (tests/puras.test.js).

var RB_VERSAO = '1.0.3';

// Primeiros nomes comuns no Brasil (sem acento, minúsculos). Se uma sequência de
// palavras com inicial maiúscula tiver um destes, ela vira "Nome Fictício".
var RB_NOMES = ('ana maria jose joao antonio francisco carlos paulo pedro lucas luiz luis marcos gabriel rafael ' +
  'daniel marcelo bruno eduardo felipe raimundo rodrigo manoel manuel mateus matheus andre fernando fabio leonardo ' +
  'gustavo guilherme leandro tiago thiago alexandre ricardo jorge diego sergio claudio vitor victor roberto ' +
  'sebastiao edson mario julio cesar renato samuel adriano henrique vinicius igor caio arthur artur heitor davi ' +
  'david miguel enzo bernardo lorenzo nicolas murilo otavio wellington washington wesley willian william jonas ' +
  'josue moises elias geraldo valdir vagner wagner reginaldo ronaldo rogerio silvio sandro marcio flavio alan ' +
  'allan italo kaique kaua yuri breno anderson cristiano emerson everton gilberto luciano mauricio nelson ' +
  'osvaldo patrick robson severino francisca antonia adriana juliana marcia fernanda patricia aline sandra ' +
  'camila amanda bruna jessica leticia julia luciana vanessa mariana gabriela vera vitoria larissa claudia ' +
  'beatriz luana rita sonia renata eliane simone daniela cristiane carla regina debora natalia raquel tatiane ' +
  'priscila andrea rosa rosana helena alice laura sofia sophia isabela isabella manuela valentina livia ' +
  'heloisa lorena cecilia clara giovana yasmin larissa carolina caroline bianca michele michelle thais ' +
  'paula monica luiza luisa joana josefa lucia lucimar edna elisangela fabiana fatima gisele ivone jaqueline ' +
  'jaqueline joelma kelly lais lidiane marlene neide rafaela rosangela sabrina silvia solange suelen tania ' +
  'valeria viviane bárbara barbara denise edilene elaine gislaine graziele ingrid irene janaina karina keila ' +
  'lilian luana mirian miriam nayara poliana roberta rosimeire sheila stefany tamires vania').split(/\s+/);

var RB_CONECTORES = ['da', 'de', 'do', 'das', 'dos', 'e'];

function rbSemAcento(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// Troca cada dígito por um da sequência 1234567890..., mantendo pontos, traços e espaços.
function rbTrocarDigitos(s) {
  var i = 0;
  return s.replace(/\d/g, function () { i++; return String(i % 10); });
}

var RB_W = '\\p{Lu}\\p{L}*';
var RB_C = '(?:da|de|do|das|dos|e|DA|DE|DO|DAS|DOS|E)';
var RB_RE_SEQ = new RegExp(RB_W + '(?:[ \\t]+(?:' + RB_C + '[ \\t]+)?' + RB_W + ')*', 'gu');

function rbEhNome(palavra) {
  return RB_NOMES.indexOf(rbSemAcento(palavra)) !== -1;
}

function rbEscRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function rbNovaContagem() {
  return { numeros: 0, emails: 0, nomes: 0, extras: 0, longos: 0, revisados: 0 };
}

// opts: { extras: ['Fulano', ...], textoLongo: true, limiteLongo: 80,
//         esconder: { 'Texto Exato': true }, cont: rbNovaContagem() }
// IDs de mensagem do WhatsApp ("wamid.HBgM...") têm o telefone do cliente codificado dentro.
// Troca por "wamid.FICTICIO1", "wamid.FICTICIO2"...; o mesmo id original vira sempre o mesmo texto.
function rbTrocarWamid(s, opts) {
  if (String(s).indexOf('wamid.') === -1) return s;
  opts.ids = opts.ids || { n: 0, mapa: {} };
  return String(s).replace(/wamid\.[A-Za-z0-9+\/=_-]+/g, function (m) {
    if (!opts.ids.mapa[m]) { opts.ids.n++; opts.ids.mapa[m] = 'wamid.FICTICIO' + opts.ids.n; }
    return opts.ids.mapa[m];
  });
}

function rbMascararTexto(s, opts) {
  opts = opts || {};
  var cont = opts.cont || rbNovaContagem();
  if (!s || !/\S/.test(s)) return s;
  var t = rbTrocarWamid(String(s), opts);

  (opts.extras || []).forEach(function (x) {
    x = String(x).trim();
    if (!x) return;
    t = t.replace(new RegExp(rbEscRegex(x), 'gi'), function () { cont.extras++; return 'Oculto'; });
  });

  t = t.replace(/[^\s@<>"'(),;:]+@[^\s@<>"'(),;:]+\.[A-Za-z]{2,}/g, function () {
    cont.emails++; return 'fulano@exemplo.com';
  });

  t = t.replace(RB_RE_SEQ, function (seq) {
    var palavras = seq.split(/[ \t]+/);
    var idx = -1;
    for (var i = 0; i < palavras.length; i++) { if (rbEhNome(palavras[i])) { idx = i; break; } }
    if (idx === -1) return seq;
    cont.nomes++;
    var maiusculo = seq === seq.toUpperCase();
    var antes = palavras.slice(0, idx).join(' ');
    var troca = maiusculo ? 'NOME FICTÍCIO' : 'Nome Fictício';
    return antes ? antes + ' ' + troca : troca;
  });

  // Textos marcados na revisão do painel.
  if (opts.esconder) {
    Object.keys(opts.esconder).forEach(function (x) {
      if (!x || !opts.esconder[x] || t.indexOf(x) === -1) return;
      // só a palavra inteira ("Ana" não pode cortar "Banana")
      var re = new RegExp('(^|[^\\p{L}\\p{N}])' + rbEscRegex(x) + '(?![\\p{L}\\p{N}])', 'gu');
      t = t.replace(re, function (m, antes) { cont.revisados++; return antes + 'Nome Fictício'; });
    });
  }

  t = t.replace(/\(?\d[\d .\-\/()]*\d\)?/g, function (m) {
    var n = m.replace(/\D/g, '').length;
    if (n < 4) return m;
    cont.numeros++;
    return rbTrocarDigitos(m);
  });

  var limite = opts.limiteLongo || 80;
  if (opts.textoLongo && t.trim().length > limite) {
    cont.longos++;
    var lead = t.match(/^\s*/)[0], trail = t.match(/\s*$/)[0];
    t = lead + '[mensagem oculta: ' + t.trim().length + ' caracteres]' + trail;
  }
  return t;
}

// Sequências de 2+ palavras com inicial maiúscula que NÃO foram mascaradas:
// podem ser nome de cliente (ex.: "Kleber Nogueira") ou texto da tela ("Resposta Privada").
function rbCandidatos(s) {
  var achados = [];
  String(s || '').replace(RB_RE_SEQ, function (seq) {
    var palavras = seq.split(/[ \t]+/).filter(function (p) { return RB_CONECTORES.indexOf(p.toLowerCase()) === -1; });
    if (palavras.length >= 2 && seq !== 'Nome Fictício' && seq !== 'NOME FICTÍCIO' && seq.indexOf('Fictício') === -1) {
      achados.push(seq);
    }
    return seq;
  });
  return achados;
}

// ---------- Montagem do HTML ----------
var RB_VAZIOS = { area: 1, base: 1, br: 1, col: 1, embed: 1, hr: 1, img: 1, input: 1, link: 1, meta: 1, source: 1, track: 1, wbr: 1 };
// Atributos que não passam pela máscara (são estrutura, usados nos seletores).
var RB_ATTR_LIVRES = { id: 1, class: 1, style: 1, slot: 1, name: 1, type: 1, role: 1, part: 1, for: 1, rel: 1,
  tabindex: 1, dir: 1, lang: 1, 'aria-hidden': 1, 'aria-expanded': 1, 'aria-selected': 1, 'aria-disabled': 1,
  disabled: 1, checked: 1, hidden: 1, variant: 1, size: 1, color: 1, icon: 1, theme: 1 };

function rbEscTexto(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function rbEscAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

// "name" só é estrutura em campos de formulário; no bds-avatar do Blip ele guarda o nome da pessoa.
var RB_TAGS_FORM = { input: 1, select: 1, textarea: 1, button: 1, form: 1, fieldset: 1, output: 1, iframe: 1,
  meta: 1, slot: 1, map: 1, param: 1, object: 1 };

function rbAttrLivre(nome, tag) {
  if (nome === 'name') return !!RB_TAGS_FORM[tag];
  return !!RB_ATTR_LIVRES[nome] || nome.indexOf('data-rb-') === 0;
}

// Texto de um nó da árvore, juntando os filhos (para achar "Nome:" e o #customer-name).
function rbTextoNo(n) {
  if (!n) return '';
  if (n.t === 'text') return n.v;
  if (n.t !== 'el' || n.raw) return '';
  return (n.kids || []).map(rbTextoNo).join('');
}

// Percorre a árvore e junta os candidatos (já depois da máscara automática).
function rbJuntarCandidatos(arvore, opts) {
  var vistos = {};
  var lista = [];
  var o = { extras: opts.extras, textoLongo: opts.textoLongo, limiteLongo: opts.limiteLongo, cont: rbNovaContagem() };
  function guardar(c) {
    if (!vistos[c]) { vistos[c] = true; lista.push(c); }
  }
  // Texto que com certeza é nome (pelo lugar onde aparece), mesmo sendo uma palavra só.
  function direto(txt) {
    var c = rbMascararTexto(String(txt || ''), o).replace(/\s+/g, ' ').trim();
    if (!c || c.length > 60 || c.indexOf('Fictício') !== -1 || c.indexOf('FICTÍCIO') !== -1 || !/\p{L}/u.test(c)) return;
    guardar(c);
  }
  function add(txt) {
    var m = rbMascararTexto(txt, o);
    rbCandidatos(m).forEach(guardar);
    var a = /Ticket\s+#?\S+\s+-\s+(.+)$/.exec(String(txt));
    if (a) direto(a[1]);
    var b = /Nome\s*:\s*([^\n:]+)/.exec(String(txt));
    if (b) direto(b[1]);
  }
  function visitar(n, raw) {
    if (!n) return;
    if (n.t === 'doc') return visitar(n.html, false);
    if (n.t === 'text') { if (!raw) add(n.v); return; }
    (n.attrs || []).forEach(function (a) {
      if (rbAttrLivre(a[0], n.tag)) return;
      add(a[1]);
      if (a[0] === 'name') direto(a[1]); // bds-avatar name="..."
    });
    var id = (n.attrs || []).filter(function (a) { return a[0] === 'id'; })[0];
    if (id && id[1] === 'customer-name') direto(rbTextoNo(n));
    if (n.sombra) n.sombra.kids.forEach(function (k) { visitar(k, false); });
    var kids = n.kids || [];
    kids.forEach(function (k, i) {
      visitar(k, n.raw);
      // <b>Nome:</b> Fulano  -> o texto logo depois do rótulo
      if (k.t === 'el' && /^\s*Nome\s*:\s*$/.test(rbTextoNo(k)) && kids[i + 1]) direto(rbTextoNo(kids[i + 1]));
    });
    if (n.doc) visitar(n.doc, false);
  }
  visitar(arvore, false);
  return lista;
}

function rbSerializarNo(n, opts) {
  if (!n) return '';
  if (n.t === 'doc') return '<!doctype html>\n' + rbSerializarNo(n.html, opts);
  if (n.t === 'text') return rbEscTexto(rbMascararTexto(n.v, opts));
  if (n.t === 'raw') return String(n.v).replace(/<\/(style)/gi, '<\\/$1');
  var h = '<' + n.tag;
  (n.attrs || []).forEach(function (a) {
    var v = rbAttrLivre(a[0], n.tag) ? rbTrocarWamid(a[1], opts) : rbMascararTexto(a[1], opts);
    h += ' ' + a[0] + (v === '' ? '' : '="' + rbEscAttr(v) + '"');
  });
  if (n.doc) h += ' srcdoc="' + rbEscAttr(rbSerializarNo(n.doc, opts)) + '"';
  h += '>';
  if (RB_VAZIOS[n.tag]) return h;
  if (n.sombra) {
    h += '<template shadowrootmode="open">';
    (n.sombra.css || []).forEach(function (id) { h += '<style data-rb-css="' + id + '"></style>'; });
    n.sombra.kids.forEach(function (k) { h += rbSerializarNo(k, opts); });
    h += '</template>';
  }
  (n.kids || []).forEach(function (k) { h += rbSerializarNo(k, opts); });
  return h + '</' + n.tag + '>';
}

// Script que roda quando o arquivo capturado é aberto: devolve o CSS para dentro das sombras.
var RB_REIDRATAR = "(function(){var e=document.getElementById('rb-css');if(!e)return;var c=JSON.parse(e.textContent);" +
  "function v(r){r.querySelectorAll('style[data-rb-css]').forEach(function(s){s.textContent=c[s.getAttribute('data-rb-css')]||''});" +
  "r.querySelectorAll('*').forEach(function(x){if(x.shadowRoot)v(x.shadowRoot)})}v(document)})();";

// arvore: {t:'doc', html}; css: ['texto css', ...]; meta: objeto com informações da captura.
function rbMontarArquivo(arvore, css, meta, opts) {
  var html = rbSerializarNo(arvore, opts);
  var cabeca = '<meta charset="utf-8"><meta name="rodbot-captura" content="' + rbEscAttr(JSON.stringify(meta)) + '">';
  if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, function (m) { return m + cabeca; });
  else html = html.replace(/<html[^>]*>/i, function (m) { return m + '<head>' + cabeca + '</head>'; });
  var json = JSON.stringify(css || []).replace(/</g, '\\u003c');
  var fim = '<script type="application/json" id="rb-css">' + json + '</script><script>' + RB_REIDRATAR + '</script>';
  var pos = html.lastIndexOf('</body>');
  html = pos === -1 ? html + fim : html.slice(0, pos) + fim + html.slice(pos);
  return html;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { RB_VERSAO: RB_VERSAO, rbMascararTexto: rbMascararTexto, rbCandidatos: rbCandidatos,
    rbNovaContagem: rbNovaContagem, rbSerializarNo: rbSerializarNo, rbMontarArquivo: rbMontarArquivo,
    rbJuntarCandidatos: rbJuntarCandidatos, rbTrocarDigitos: rbTrocarDigitos };
}
