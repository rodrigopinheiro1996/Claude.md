# BM Captura Blip

## Objetivo
Bookmarklet que salva a tela do Blip num arquivo `.html` (com Shadow DOM dos `bds-*`, iframes do mesmo site,
posição e visibilidade de cada elemento), **com dados de clientes mascarados**, para o Claude mapear os
elementos e montar/testar os BMs em cima de uma cópia fiel da tela real.

## Regras
- Só lê a tela. Não clica, não envia, não altera nada no Blip.
- Máscara (src/puras.js): números com 4+ dígitos, e-mails, nomes comuns (lista RB_NOMES), nomes extras do
  painel, mensagens longas (opção) e a lista de revisão (marcado = escondido).
- O painel não entra na captura. Scripts da página não entram. Imagens perdem o `src`.
- No arquivo: `data-rb-rect="x,y,largura,altura"`, `data-rb-visivel="1|0"`,
  `data-rb-sombra="fechada-ou-vazia"`, `data-rb-iframe="sem-acesso"`, `<meta name="rodbot-captura">`.
- Shadow DOM vira `<template shadowrootmode="open">` e volta a ser sombra quando o arquivo é aberto no Chrome/Edge.

- Modal que trava a tela (ex.: "Transferir atendimento"): `src/manter-clicavel.js` move o painel para dentro do
  `<dialog>` modal aberto e devolve quando fecha. Serve para outros BMs também. Na captura: `data-rb-modal="1"`.
- Modal que cancela cliques fora dele (CONFIRMADO no Blip real, v1.0.1: painel aparecia por cima mas não
  respondia): o "escudo" em `src/painel.js` ouve os eventos na `window` (fase de captura), para a propagação
  quando o evento é no painel e executa a ação do botão (`ao(elemento, função)`). Não use `addEventListener('click')`
  nos botões do painel: registre com `ao()`.

## Comandos
- `npm run build`: gera `dist/RodBot-captura-blip-vX.Y.Z.html` (não edite o dist à mão)
- `npm test`: máscara, sincronia dist↔src, e teste de tela na página falsa (`tests/pagina-falsa-blip.html`)

## Deduzido (não confirmado no Blip real)
- Estrutura da página falsa (bds-typo/bds-button com slot) é suposição. Validar com a primeira captura real.
- Que o modal "Transferir atendimento" cancela os cliques com ouvintes no `document` (como bibliotecas de
  "focus trap"). Se o Blip ouvir na `window` antes do BM, o escudo não resolve. Validar no Blip real.
