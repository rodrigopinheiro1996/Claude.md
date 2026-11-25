# Mapa de elementos do Blip Desk

Tirado das capturas reais de 25/11/2026 (BM Captura Blip v1.0.0 e v1.0.1, tela `/chat`, janela 1698×776).
Só seletores e textos da tela; nenhum dado de cliente.

## Confirmado no Blip real

| O quê | Seletor | Observação |
|---|---|---|
| Botão "Atender" | `#claim-ticket-button` | `bds-button` |
| Botão "Mensagem ativa" | `bds-button` com texto "Mensagem ativa" | **sem id**: achar pelo texto (atravessando o slot) |
| Contador "Clientes aguardando" | `#waiting-tickets-count` | `bds-typo`, texto = número |
| Busca de conversas | `#search-input` | `bds-input`, aria-label "Campo de busca por nome ou telefone" |
| Filtro (Todos / Não lidos / Em espera…) | `#ticket-filter-dropdown` | `bds-dropdown` |
| Criar pasta | `#create-folder-btn` | `bds-button-icon` |
| Item da lista de conversas | `article[id$="-chat-list-item"]` | id = `<uuid>-chat-list-item`; aria-label `Ticket <número> - <nome do cliente>` |
| Nome do cliente (topo da conversa) | `#customer-name` | `span` |
| Número do ticket | `#ticket-sequential-id` | texto `#<número>` |
| Bot / Fila do ticket | `#ticket-bot` / `#ticket-team` | ex.: `DIRECT_TRANSFER` |
| Buscar na conversa | `bds-button-icon[icon="search"]` | sem id |
| **Botão Transferir** | `#transfer-ticket-button` | `bds-button-icon`, `icon="transfer"`, dentro de um wrapper com título "Transferir" |
| Botão Finalizar | `#close-ticket-button` | `bds-button`, `icon="checkball"` |
| Mensagens da conversa | `div` com id = id da mensagem | `wamid.*` (WhatsApp), `activecampaign:*` (mensagem ativa), `fwd:fwd:*` (encaminhada) |
| Menu lateral | `button` com texto "Atendimentos", "Mensagens ativas", "Métricas de atendimento", "Contatos", "Ajuda", "Preferências" | sem id |

- A página tem ~5.000 elementos e ~550 componentes com Shadow DOM aberto. Nenhuma sombra fechada.
- Os 4 iframes da página estão vazios (não são a conversa).

## Nomes que o agent-browser lê (seletor reserva)

O agent-browser lê a tela como um leitor de tela: cada botão tem um **nome acessível**. Esse nome é um bom
**seletor reserva** quando o id mudar (ex.: procurar o botão cujo `aria-label`/texto é "Transferir").
Gerado com `ferramentas/mapear.sh` na captura de 25/11 13h29.

| Elemento | Seletor principal | Nome que o agent-browser lê | Observação |
|---|---|---|---|
| Atender | `#claim-ticket-button` | button "Atender" | o `bds-button` tem `aria-hidden="true"`: o botão clicável de verdade está dentro da sombra |
| Mensagem ativa | (sem id) `bds-button[variant="ghost"]` com texto "Mensagem ativa" | button "Mensagem ativa" | achar pelo texto |
| Busca de conversas | `#search-input` → sombra → `input.input__container__text` | textbox "Busque pelo nome ou telefone..." | o campo de verdade está dentro da sombra do `bds-input` |
| Filtros | `#ticket-filter-dropdown` | buttons "Todos (n)", "Não lidos (n)", "Em espera (n)", "Finalizados (n)" | o número muda: comparar só o começo |
| Item da conversa | `article[id$="-chat-list-item"]` | navigation "Ticket <n> - <nome>" | |
| Pesquisar na conversa | `bds-button-icon[icon="search"]` | button "Pesquisar na conversa" | |
| **Transferir** | `#transfer-ticket-button` | button "Transferir" | nome vem do wrapper com título "Transferir" |
| **Finalizar** | `#close-ticket-button` | button "Finalizar" | fica dentro de `bds-tooltip[tooltip-text="Finalizar"]` |
| **Caixa de mensagem** | `#text-input` (textarea, **fora** de sombra) | textbox "Escreva uma mensagem..." | |
| Resposta pronta | `#custom-reply-btn` | button "Enviar resposta pronta" | `icon="ab"` |
| Anexar arquivo | `#send-file-btn` | button "Enviar arquivos (máximo de 10 arquivos por envio)" | `icon="attach"` |
| Emojis / Áudio | `bds-button-icon[icon="emoji"]` / `[icon="audio"]` | "Adicionar emojis" / "Enviar um áudio" | |
| Sugestões | `[data-testid="suggestions-button"]` | (sem nome) | |
| Abas da direita | `bds-typo` com texto "Informações", "Histórico", "Falar com gestor" | mesmos textos | sem id: achar pelo texto |
| Comentário | `#comment-input` → sombra → `textarea` | textbox "Escreva um comentário..." | |
| Mensagens | `div[id]` (id da mensagem) | "<data hora> Agente diz:" / "Cliente diz:" | dá para separar agente × cliente pelo nome acessível |

## Modal "Transferir atendimento" (captura real de 25/11 14h04, agent-browser)

Abre ao clicar em `#transfer-ticket-button`. Fica em `div#dynamic-modal-main > bds-modal > … > div#transfer-attendance`.
Não é `<dialog>`: é um `bds-modal` que **cancela cliques fora dele** (o escudo do painel resolve, confirmado na v1.0.2).

| Elemento | Seletor principal | Nome que o agent-browser lê | Observação |
|---|---|---|---|
| Esperar o modal abrir | `#transfer-attendance` | — | título: `bds-typo#modal-title` = "Transferir atendimento do Ticket #<n>" |
| Opção "Fila" | `bds-radio[label="Fila"]` | radio "Fila" (já vem marcada) | o `<input>` de dentro tem id gerado (`bds-radio-0`): **não usar** |
| Opção "Atendente" | `bds-radio[label="Atendente"]` | radio "Atendente" | idem |
| Lista de filas | `#autocompleteTeam` (`bds-autocomplete`, fora de sombra) | "Selecionar fila" + textbox | o campo de digitar está na sombra dele |
| Opções da lista | `#autocompleteTeam` → sombra → `bds-select-option` | button "<fila> <n> Disponíveis" | **já existem na tela mesmo com a lista fechada**; texto da fila = texto do `bds-select-option` |
| Lista de filas (dados) | atributo `options` do `#autocompleteTeam` | — | JSON: `[{label, value: '{"name":…,"agentsOnline":…}', status: "25 Disponíveis"}]`. Dá para conferir se a fila existe **antes** de abrir a lista |
| Transferir ticket | `#confirm-transfer-btn` | button "Transferir ticket" | começa com `disabled="true"`: só libera depois de escolher a fila. **É o clique final de envio** |
| Cancelar | `#transfer-attendance bds-button[variant="secondary"]` com texto "Cancelar" | button "Cancelar" | sem id |
| Fechar (X) | ícone "close" do `bds-modal` | image "close" | |

Para um BM de transferir: modo Simular = abrir modal → escolher fila → conferir que `#confirm-transfer-btn` liberou →
**Cancelar** (sem clicar em "Transferir ticket").

## Ainda falta capturar
- Opção **"Atendente"** marcada (a lista muda para atendentes; não capturado).
- Por que o painel trava com a lista "Selecionar fila" **aberta** (não precisa para mapear: as opções já vêm na captura com a lista fechada).
