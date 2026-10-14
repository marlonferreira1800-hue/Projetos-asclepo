@echo off
title 🌐 Asclepio Navegador Autônomo
chcp 65001 > nul
cd /d "%~dp0asclepio-navegador"

if not exist node_modules (
    echo ==============================================================================
    echo   [1/2] Primeira execucao detectada: instalando dependencias Node / Electron...
    echo ==============================================================================
    call npm install
)

if not exist .env (
    if exist .env.example (
        echo [Aviso] Criando arquivo .env a partir de .env.example...
        copy .env.example .env > nul
    )
)

echo.
echo [2/2] Iniciando Asclepio Navegador Autonomo...
npm start
