// Painel flutuante do BM de captura.

function rbIniciar() {
  var ID = 'rb-captura-host';
  var existente = document.getElementById(ID);
  if (existente) { existente.style.display = ''; return; } // clicar 2x no BM não abre 2 painéis

  var CHAVE = 'rbCapturaBlip.v1';
  var pref = {};
  try { pref = JSON.parse(localStorage.getItem(CHAVE) || '{}') || {}; } catch (e) { pref = {}; }
  function salvarPref() { try { localStorage.setItem(CHAVE, JSON.stringify(pref)); } catch (e) {} }

  var host = document.createElement('div');
  host.id = ID;
  host.style.cssText = 'position:fixed;top:20px;right:20px;z-index:2147483647;';
  var sr = host.attachShadow({ mode: 'open' });
  sr.innerHTML =
    '<style>' +
    '*{box-sizing:border-box;font-family:Segoe UI,Arial,sans-serif}' +
    '.p{width:330px;background:#fff;color:#1d2433;border:1px solid #c9d2e0;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.25);overflow:hidden;font-size:13px}' +
    '.topo{display:flex;align-items:center;gap:6px;background:#0a84ff;color:#fff;padding:7px 10px;cursor:move;user-select:none}' +
    '.topo b{flex:1;font-size:13px}.topo button{background:transparent;border:none;color:#fff;font-size:16px;cursor:pointer;padding:0 4px}' +
    '.corpo{padding:10px;display:flex;flex-direction:column;gap:8px;max-height:75vh;overflow:auto}' +
    'input[type=text]{width:100%;padding:6px;border:1px solid #c9d2e0;border-radius:6px}' +
    '.bt{border:1px solid #c9d2e0;background:#fff;border-radius:999px;padding:6px 12px;cursor:pointer}' +
    '.bt.az{background:#0a84ff;color:#fff;border-color:#0a84ff;font-weight:600}.bt:disabled{opacity:.5;cursor:not-allowed}' +
    '.linha{display:flex;gap:6px;flex-wrap:wrap;align-items:center}' +
    '.rev{border:1px solid #f0c36d;background:#fff8e6;border-radius:8px;padding:8px;display:none}' +
    '.lista{max-height:180px;overflow:auto;margin:6px 0;background:#fff;border:1px solid #eee;border-radius:6px;padding:4px}' +
    '.lista label{display:block;padding:2px 0}' +
    '.log{background:#f5f7fb;border-radius:6px;padding:6px;font:12px Consolas,monospace;max-height:120px;overflow:auto;white-space:pre-wrap}' +
    '.min .corpo{display:none}.dica{color:#6b7385;font-size:12px}' +
    '</style>' +
    '<div class="p">' +
    '<div class="topo"><b>📸 Captura Blip v' + RB_VERSAO + '</b><button class="bmin" title="Minimizar">–</button><button class="bfec" title="Fechar">×</button></div>' +
    '<div class="corpo">' +
    '<div class="dica">Salva esta tela num arquivo, com dados de clientes escondidos, para o Claude mapear os elementos. Nada é enviado: o arquivo só vai para a sua pasta Downloads.</div>' +
    '<label>Nomes extras para esconder (separe por ;)<input type="text" class="extras" placeholder="ex.: Kleber; Nogueira"></label>' +
    '<label><input type="checkbox" class="longo"> Esconder mensagens longas (mais de 80 letras)</label>' +
    '<div class="linha"><button class="bt az bcap">📸 Capturar agora</button><button class="bt bcap5">⏱ Capturar em 5 s</button></div>' +
    '<div class="rev"><b>Revise antes de baixar.</b> Estes textos podem ser nome de cliente. <b>Marcados serão escondidos.</b> Desmarque só o que for texto da tela (ex.: "Resposta Privada").' +
    '<div class="linha" style="margin-top:6px"><button class="bt btodos">Marcar todos</button><button class="bt bnenhum">Desmarcar todos</button></div>' +
    '<div class="lista"></div>' +
    '<button class="bt az bbaixar">⬇ Baixar arquivo</button></div>' +
    '<div class="log"></div>' +
    '</div></div>';
  document.documentElement.appendChild(host);

  function $(s) { return sr.querySelector(s); }
  var painel = $('.p');
  var campoExtras = $('.extras'), campoLongo = $('.longo');
  campoExtras.value = pref.extras || '';
  campoLongo.checked = pref.longo !== false;
  campoExtras.addEventListener('change', function () { pref.extras = campoExtras.value; salvarPref(); });
  campoLongo.addEventListener('change', function () { pref.longo = campoLongo.checked; salvarPref(); });

  function log(msg) {
    var l = $('.log');
    var h = new Date().toLocaleTimeString('pt-BR');
    l.textContent += '[' + h + '] ' + msg + '\n';
    l.scrollTop = l.scrollHeight;
  }

  // Arrastar pela barra superior
  (function () {
    var topo = $('.topo'), dx = 0, dy = 0, arrastando = false;
    topo.addEventListener('mousedown', function (e) {
      if (e.target.tagName === 'BUTTON') return;
      arrastando = true;
      var r = host.getBoundingClientRect();
      dx = e.clientX - r.left; dy = e.clientY - r.top;
      e.preventDefault();
    });
    window.addEventListener('mousemove', function (e) {
      if (!arrastando) return;
      host.style.left = Math.max(0, e.clientX - dx) + 'px';
      host.style.top = Math.max(0, e.clientY - dy) + 'px';
      host.style.right = 'auto';
    });
    window.addEventListener('mouseup', function () { arrastando = false; });
  })();
  $('.bmin').addEventListener('click', function () { painel.classList.toggle('min'); });
  $('.bfec').addEventListener('click', function () { host.remove(); });

  var captura = null; // { arvore, css, info, quando, opts, candidatos }

  function opcoes() {
    return {
      extras: campoExtras.value.split(';').map(function (s) { return s.trim(); }).filter(Boolean),
      textoLongo: campoLongo.checked,
      limiteLongo: 80
    };
  }

  function capturar() {
    try {
      var t0 = Date.now();
      var c = rbCapturarArvore(host);
      var o = opcoes();
      captura = { arvore: c.arvore, css: c.css, info: c.info, quando: new Date(), opts: o };
      captura.candidatos = rbJuntarCandidatos(c.arvore, o);
      log('Tela lida em ' + (Date.now() - t0) + ' ms: ' + c.info.elementos + ' elementos, ' + c.info.sombras +
        ' sombras (Shadow DOM), ' + c.info.iframes + ' iframes' +
        (c.info.iframesSemAcesso ? ' (' + c.info.iframesSemAcesso + ' sem acesso)' : '') + '.');
      mostrarRevisao();
    } catch (e) {
      log('⚠ Erro ao ler a tela: ' + (e && e.message ? e.message : e));
    }
  }

  function mostrarRevisao() {
    var lista = $('.lista');
    lista.innerHTML = '';
    if (!captura.candidatos.length) {
      lista.textContent = 'Nenhum texto suspeito encontrado.';
    }
    captura.candidatos.forEach(function (c) {
      var lb = document.createElement('label');
      var cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = true; cb.value = c;
      lb.appendChild(cb); lb.appendChild(document.createTextNode(' ' + c));
      lista.appendChild(lb);
    });
    $('.rev').style.display = 'block';
    log(captura.candidatos.length + ' texto(s) para revisar. Depois clique em "Baixar arquivo".');
  }

  function marcar(v) {
    Array.prototype.forEach.call(sr.querySelectorAll('.lista input'), function (cb) { cb.checked = v; });
  }
  $('.btodos').addEventListener('click', function () { marcar(true); });
  $('.bnenhum').addEventListener('click', function () { marcar(false); });

  function doisDig(n) { return (n < 10 ? '0' : '') + n; }

  $('.bbaixar').addEventListener('click', function () {
    if (!captura) return;
    try {
      var esconder = {};
      Array.prototype.forEach.call(sr.querySelectorAll('.lista input'), function (cb) { if (cb.checked) esconder[cb.value] = true; });
      var cont = rbNovaContagem();
      var o = { extras: captura.opts.extras, textoLongo: captura.opts.textoLongo, limiteLongo: captura.opts.limiteLongo,
        esconder: esconder, cont: cont };
      var q = captura.quando;
      var meta = {
        bm: 'captura-blip', versao: RB_VERSAO, data: q.toISOString(),
        endereco: rbMascararTexto(location.origin + location.pathname + location.hash, { cont: rbNovaContagem() }),
        janela: [window.innerWidth, window.innerHeight], info: captura.info
      };
      var html = rbMontarArquivo(captura.arvore, captura.css, meta, o);
      var nome = 'captura-blip-' + q.getFullYear() + '-' + doisDig(q.getMonth() + 1) + '-' + doisDig(q.getDate()) +
        '-' + doisDig(q.getHours()) + 'h' + doisDig(q.getMinutes()) + 'm' + doisDig(q.getSeconds()) + '.html';
      var blob = new Blob([html], { type: 'text/html' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = nome;
      sr.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
      log('✔ Arquivo salvo: ' + nome + ' (' + Math.round(blob.size / 1024) + ' KB).');
      log('Escondidos: ' + cont.numeros + ' números, ' + cont.emails + ' e-mails, ' + cont.nomes + ' nomes, ' +
        cont.revisados + ' da revisão, ' + cont.extras + ' extras, ' + cont.longos + ' mensagens longas.');
      log('Abra o arquivo e confira se não sobrou dado de cliente antes de mandar.');
    } catch (e) {
      log('⚠ Erro ao montar o arquivo: ' + (e && e.message ? e.message : e));
    }
  });

  var botoes = [$('.bcap'), $('.bcap5')];
  function travar(v) { botoes.forEach(function (b) { b.disabled = v; }); }
  $('.bcap').addEventListener('click', capturar);
  $('.bcap5').addEventListener('click', function () {
    var falta = 5;
    travar(true);
    log('Capturando em 5 s: abra agora o menu ou aviso que quer salvar.');
    var tm = setInterval(function () {
      falta--;
      if (falta > 0) { $('.bcap5').textContent = '⏱ ' + falta + ' s...'; return; }
      clearInterval(tm);
      $('.bcap5').textContent = '⏱ Capturar em 5 s';
      travar(false);
      capturar();
    }, 1000);
  });

  log('Pronto. Deixe a tela do Blip do jeito que quer salvar e clique em Capturar.');
}
