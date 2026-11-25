#!/usr/bin/env bash
# Mapeia uma captura do BM Captura Blip com o agent-browser (sem internet, só o arquivo).
# Uso: ferramentas/mapear.sh captura-blip-....html [saida.txt]
# Saída: lista de elementos clicáveis/campos com o nome que o leitor de tela usa (@eN = referência).
set -euo pipefail
ARQ="$(realpath "$1")"
SAIDA="${2:-${ARQ%.html}.mapa.txt}"
S="--session mapa-blip-$$"
export AGENT_BROWSER_EXECUTABLE_PATH="${AGENT_BROWSER_EXECUTABLE_PATH:-/opt/pw-browsers/chromium-1243/chrome-linux64/chrome}"
trap 'agent-browser $S close >/dev/null 2>&1 || true' EXIT
agent-browser $S --args "--no-sandbox" open about:blank >/dev/null
agent-browser $S set offline on >/dev/null          # a captura nunca acessa a internet
agent-browser $S set viewport 1698 776 >/dev/null   # tamanho da janela do Rodrigo
agent-browser $S open "file://$ARQ" >/dev/null
agent-browser $S snapshot -i -c > "$SAIDA"
echo "Mapa salvo em: $SAIDA ($(wc -l < "$SAIDA") elementos)"
