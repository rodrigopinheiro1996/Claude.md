// Leitura da página (mexe no DOM). Transforma a tela numa árvore simples,
// atravessando Shadow DOM (componentes bds-* do Blip) e iframes do mesmo site.

function rbTextoDaFolha(folha) {
  try {
    return Array.prototype.map.call(folha.cssRules, function (r) { return r.cssText; }).join('\n');
  } catch (e) { return null; } // folha de outro site: o navegador não deixa ler
}

function rbCapturarArvore(ignorar) {
  var cssIds = {};      // texto css -> número
  var css = [];         // lista de textos css (vai uma vez só no arquivo)
  var info = { modais: 0, inert: 0, elementos: 0, sombras: 0, sombrasFechadas: 0, iframes: 0, iframesSemAcesso: 0 };

  function idCss(texto) {
    if (texto == null || texto === '') return null;
    if (!(texto in cssIds)) { cssIds[texto] = css.length; css.push(texto); }
    return cssIds[texto];
  }

  function adotadas(raiz) {
    var ids = [];
    (raiz.adoptedStyleSheets || []).forEach(function (f) {
      var id = idCss(rbTextoDaFolha(f));
      if (id !== null) ids.push(id);
    });
    return ids;
  }

  function filhos(pai, dentroDoBody) {
    var lista = [];
    var nos = pai.childNodes;
    for (var i = 0; i < nos.length; i++) {
      var r = andar(nos[i], dentroDoBody);
      if (r) lista.push(r);
    }
    return lista;
  }

  function andar(n, dentroDoBody) {
    if (n.nodeType === 3) return { t: 'text', v: n.data };
    if (n.nodeType !== 1) return null;
    if (n === ignorar) return null;
    var tag = n.localName;
    if (tag === 'script' || tag === 'noscript') return null;
    info.elementos++;
    var noBody = dentroDoBody || tag === 'body';

    var attrs = [];
    for (var i = 0; i < n.attributes.length; i++) attrs.push([n.attributes[i].name, n.attributes[i].value]);
    function tirar(nome) { attrs = attrs.filter(function (a) { return a[0] !== nome; }); }
    function por(nome, v) { tirar(nome); attrs.push([nome, v]); }

    // <link rel=stylesheet> vira <style> com o conteúdo (se o navegador deixar ler).
    if (tag === 'link' && /stylesheet/i.test(n.rel || '') && n.sheet) {
      var txt = rbTextoDaFolha(n.sheet);
      if (txt !== null) return { t: 'el', tag: 'style', attrs: [['data-rb-de', n.href || '']], raw: true, kids: [{ t: 'raw', v: txt }] };
    }
    if (tag === 'style') {
      return { t: 'el', tag: 'style', attrs: attrs, raw: true, kids: [{ t: 'raw', v: n.textContent }] };
    }

    // Valores digitados nos campos (vão pela máscara).
    if (tag === 'input') {
      if (n.type === 'checkbox' || n.type === 'radio') { if (n.checked) por('checked', ''); else tirar('checked'); }
      else if (n.type !== 'password') por('value', n.value || '');
      else por('value', '');
    }
    if (tag === 'select' && n.selectedIndex >= 0) por('data-rb-selecionado', String(n.selectedIndex));

    // Imagens e mídia: tira o endereço (pode ter foto do cliente).
    if (tag === 'img' || tag === 'source' || tag === 'video' || tag === 'audio') {
      if (n.getAttribute('src') || n.getAttribute('srcset')) por('data-rb-src-removido', '1');
      tirar('src'); tirar('srcset');
    }

    // Posição na tela e se está visível (ajuda a achar o elemento certo depois).
    if (noBody && n.getBoundingClientRect) {
      var r = n.getBoundingClientRect();
      var vis = typeof n.checkVisibility === 'function'
        ? n.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })
        : (r.width > 0 && r.height > 0);
      attrs.push(['data-rb-rect', [r.x, r.y, r.width, r.height].map(Math.round).join(',')]);
      attrs.push(['data-rb-visivel', vis ? '1' : '0']);
    }

    if (tag === 'dialog' && n.open && n.matches(':modal')) { info.modais++; attrs.push(['data-rb-modal', '1']); }
    if (n.hasAttribute('inert')) info.inert++;

    var no = { t: 'el', tag: tag, attrs: attrs, kids: null, sombra: null };

    if (tag === 'textarea') {
      no.kids = [{ t: 'text', v: n.value || '' }];
      return no;
    }

    if (tag === 'iframe') {
      info.iframes++;
      var doc = null;
      try { doc = n.contentDocument; } catch (e) { doc = null; }
      if (doc && doc.documentElement) {
        no.attrs = attrs.filter(function (a) { return a[0] !== 'src' && a[0] !== 'srcdoc'; });
        no.doc = { t: 'doc', html: andarDoc(doc) };
      } else {
        info.iframesSemAcesso++;
        attrs.push(['data-rb-iframe', 'sem-acesso']);
      }
      no.kids = [];
      return no;
    }

    if (n.shadowRoot) {
      info.sombras++;
      no.sombra = { css: adotadas(n.shadowRoot), kids: filhos(n.shadowRoot, noBody) };
    } else if (tag.indexOf('-') !== -1 && !n.childNodes.length && window.customElements && customElements.get(tag)) {
      // componente sem sombra aberta e sem filhos: pode ter sombra fechada (não dá para ler por dentro)
      attrs.push(['data-rb-sombra', 'fechada-ou-vazia']);
      info.sombrasFechadas++;
    }
    no.kids = filhos(n, noBody);
    return no;
  }

  function andarDoc(doc) {
    var raiz = andar(doc.documentElement, false);
    var ids = adotadas(doc);
    if (ids.length && raiz) {
      var head = (raiz.kids || []).filter(function (k) { return k.tag === 'head'; })[0];
      if (head) ids.forEach(function (id) { head.kids.push({ t: 'el', tag: 'style', attrs: [['data-rb-css', String(id)]], raw: true, kids: [] }); });
    }
    return raiz;
  }

  var arvore = { t: 'doc', html: andarDoc(document) };
  return { arvore: arvore, css: css, info: info };
}
