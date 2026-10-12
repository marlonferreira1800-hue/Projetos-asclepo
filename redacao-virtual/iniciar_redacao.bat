@echo off
cd /d "%~dp0"
title Decifrando Dados - Redacao Virtual 2D
echo ============================================================
echo   DECIFRANDO DADOS - REDACAO VIRTUAL 2D
echo   Estudio de Agentes IA ("The BRIEF" - Marlon Ferreira)
echo ============================================================
echo.
echo [1/2] Agendando abertura do navegador...
start /b powershell -Command "Start-Sleep -Milliseconds 1200; Start-Process 'http://localhost:8080'"
echo [2/2] Iniciando servidor aiohttp / WebSockets na porta 8080...
echo.
python server.py 8080
pause
