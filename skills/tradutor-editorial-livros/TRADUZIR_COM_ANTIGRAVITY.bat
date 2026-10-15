@echo off
chcp 65001 > nul
title Motor de Tradução Nativo do Antigravity (Assinatura Gemini)

echo ===============================================================================
echo   ⚡ MOTOR DE TRADUÇÃO EDITORIAL NATIVO DO ANTIGRAVITY (ASSINATURA)
echo        Execução direta via agy.exe • Zero chaves de API • Checkpoint Contínuo
echo ===============================================================================
echo.

cd /d "%~dp0"
python traduzir_com_antigravity.py %*

echo.
pause
