@echo off
echo ===================================================
echo     CRONOS ORCHESTRATOR - INICIALIZADOR
echo ===================================================
echo 1. Sincronizando banco de dados com tabelas do SQL...
call node scripts/update-db.mjs
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao sincronizar banco de dados. Certifique-se de que o container PostgreSQL esta ativo (npm run docker:up).
    pause
    exit /b %errorlevel%
)

echo.
echo 2. Iniciando servicos Frontend, Backend HTTP e Realtime WebSocket...
call npm run dev
