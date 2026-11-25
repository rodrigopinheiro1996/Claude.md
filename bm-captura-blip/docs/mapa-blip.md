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

## Ainda falta capturar
- **Modal "Transferir atendimento"** (aberto, com a lista "Selecionar fila" aberta e com a opção "Atendente").
  Nenhuma das capturas de 25/11 pegou o modal. O painel v1.0.0/v1.0.1 não responde com o modal aberto;
  usar a v1.0.3 (escudo).
