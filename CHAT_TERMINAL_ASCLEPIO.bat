@echo off
chcp 65001 > nul
title Asclepio - Terminal Interativo
cd /d "%~dp0"

echo.
echo ============================================================
echo   ⚡ INICIANDO ASCLEPIO - MODO CHAT INTERATIVO NO TERMINAL
echo ============================================================
echo.

node bin/asclepio.mjs chat

pause
