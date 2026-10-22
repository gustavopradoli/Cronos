#!/usr/bin/env bash

echo "==================================================="
echo "    CRONOS ORCHESTRATOR - INICIALIZADOR"
echo "==================================================="
echo "1. Sincronizando banco de dados com tabelas do SQL..."

node scripts/update-db.mjs
status=$?
if [ "$status" -ne 0 ]; then
    echo "[ERRO] Falha ao sincronizar banco de dados. Certifique-se de que o container PostgreSQL esta ativo (npm run docker:up)."
    read -n 1 -s -r -p "Pressione qualquer tecla para continuar..."
    echo
    exit "$status"
fi

echo
echo "2. Iniciando servicos Frontend, Backend HTTP e Realtime WebSocket..."
npm run dev