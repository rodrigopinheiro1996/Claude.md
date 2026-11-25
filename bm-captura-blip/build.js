// Gera o HTML instalador a partir de src/. Rode: npm run build
const fs = require('fs');
const path = require('path');
const { RB_VERSAO } = require('./src/puras.js');

const ORDEM = ['puras.js', 'dom.js', 'manter-clicavel.js', 'painel.js'];

function montarCodigo() {
  const partes = ORDEM.map(f => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8'));
  return '(function(){' + partes.join('\n') + '\nrbIniciar();})();';
}

function montarHref(codigo) {
  return 'javascript:' + encodeURIComponent(codigo);
}

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function montarInstalador() {
  const href = montarHref(montarCodigo());
  const modelo = fs.readFileSync(path.join(__dirname, 'src', 'instalador.html'), 'utf8');
  return modelo.split('{{VERSAO}}').join(RB_VERSAO).split('{{HREF}}').join(esc(href));
}

function nomeArquivo() { return `RodBot-captura-blip-v${RB_VERSAO}.html`; }

if (require.main === module) {
  const saida = path.join(__dirname, 'dist', nomeArquivo());
  fs.writeFileSync(saida, montarInstalador());
  console.log('Gerado:', path.relative(__dirname, saida));
}

module.exports = { montarCodigo, montarHref, montarInstalador, nomeArquivo };
