@echo off
title ⚡ Asclepio - Agente Autônomo & Gateway Platform
chcp 65001 > nul
cd /d "%~dp0asclepio-agente-autonomo"

if not exist asclepio.config.json (
    if exist asclepio.config.example.json (
        echo [Aviso] Criando asclepio.config.json a partir do modelo de exemplo...
        copy asclepio.config.example.json asclepio.config.json > nul
        echo Configure sua chave de API no arquivo asclepio.config.json se necessario.
    )
)

echo.
echo ==============================================================================
echo   ⚡ INICIANDO ASCLEPIO — AGENTE AUTÔNOMO & GATEWAY (PORTA 18888)
echo ==============================================================================
echo.

call INICIAR_ASCLEPIO.bat
