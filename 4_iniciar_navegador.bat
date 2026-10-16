@echo off
title 🌐 Asclepio Browser (Next-Gen Polar Canvas)
chcp 65001 > nul

if exist "%~dp0asclepio-browser" (
    cd /d "%~dp0asclepio-browser"
    if not exist node_modules (
        echo ==============================================================================
        echo   [1/2] Primeira execucao detectada: instalando dependencias (Electron + React + Vite)...
        echo ==============================================================================
        call npm install
    )
    if not exist .env (
        if exist .env.example copy .env.example .env > nul
    )
    echo.
    echo [2/2] Iniciando Asclepio Browser...
    call npm run dev
) else (
    cd /d "%~dp0asclepio-navegador"
    if not exist node_modules (
        call npm install
    )
    npm start
)
