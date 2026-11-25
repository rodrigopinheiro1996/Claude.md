// Mantém o painel clicável quando o site abre um modal que trava o resto da tela
// (ex.: "Transferir atendimento" no Blip).
//
// Como funciona: a cada meio segundo, pergunta ao navegador "o que está no centro do painel?".
// Se a resposta não for o próprio painel, algo está por cima/travando. Se esse algo estiver
// dentro de um <dialog> aberto em modo modal, o painel é movido para dentro dele (o navegador
// só deixa clicar no que está dentro do modal). Quando o modal fecha, o painel volta ao lugar.
//
// DEDUZIDO, não confirmado no Blip real: que o modal do Blip é um <dialog> aberto com showModal().

function rbElementoNoPonto(x, y) {
  var el = document.elementFromPoint(x, y);
  // desce pelas sombras (Shadow DOM) até o elemento mais de dentro
  for (var i = 0; el && el.shadowRoot && i < 30; i++) {
    var d = el.shadowRoot.elementFromPoint(x, y);
    if (!d || d === el) break;
    el = d;
  }
  return el;
}

function rbDialogoAcima(el) {
  // sobe pelos pais, saindo das sombras, até achar um <dialog> aberto em modo modal
  for (var i = 0; el && i < 500; i++) {
    if (el.localName === 'dialog' && el.open && el.matches(':modal')) return el;
    el = el.parentNode || el.host || null;
  }
  return null;
}

function rbManterClicavel(host, sr, log) {
  var casa = document.documentElement;
  var dentroDe = null;
  var avisou = false;

  function verificar() {
    if (!host.isConnected && !dentroDe) { clearInterval(tm); return; }

    // modal fechou: volta para o lugar original
    if (dentroDe && (!dentroDe.isConnected || !dentroDe.open)) {
      casa.appendChild(host);
      dentroDe = null;
      log && log('Modal fechado: painel voltou ao normal.');
      return;
    }
    if (host.style.display === 'none') return;

    var r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var x = r.left + Math.min(r.width / 2, 60), y = r.top + 12; // barra superior do painel
    if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return;
    var el = rbElementoNoPonto(x, y);
    if (el === host || (el && sr.contains(el))) return; // tudo certo

    var dlg = rbDialogoAcima(el);
    if (dlg && dlg !== dentroDe) {
      dlg.appendChild(host);
      dentroDe = dlg;
      avisou = false;
      log && log('Modal aberto: painel movido para continuar clicável.');
    } else if (!dlg && !avisou) {
      avisou = true; // avisa uma vez só, para ajudar a descobrir o que está travando
      log && log('⚠ Algo está por cima do painel (' + (el ? el.localName + (el.id ? '#' + el.id : '') : '?') +
        '). Se não conseguir clicar, arraste o painel ou avise o Claude.');
    }
  }

  var tm = setInterval(verificar, 500);
  return { verificar: verificar, parar: function () { clearInterval(tm); } };
}
