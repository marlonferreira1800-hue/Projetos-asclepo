@echo off
title 🏛️ Hub de Projetos Asclepio | Marlon Ferreira
chcp 65001 > nul
setlocal

:menu
cls
echo ==============================================================================
echo   🏛️  PROJETOS ASCLEPIO — HUB CENTRAL DE ACESSO
echo   Curadoria & Desenvolvimento: Marlon Ferreira
echo ==============================================================================
echo.
echo   Selecione o projeto que deseja inicializar:
echo.
echo   [1] ⚡ Asclepio Notícias (Radar Global Web)
echo       Porta: http://localhost:5050
echo       Descricao: Coletor RSS, Busca Mundial 360 e Breaking News
echo.
echo   [2] 🪙 Calculadora de Tokens Gemini Pro (Studio Web)
echo       Porta: http://localhost:8765
echo       Descricao: Rastreamento em tempo real de tokens e custos de IA
echo.
echo   [3] 📰 Redação Virtual Decifrando Dados (Canvas 2D RPG)
echo       Porta: http://localhost:8080
echo       Descricao: Estudio de Agentes com IA NVIDIA 550B e The BRIEF
echo.
echo   [4] 🌐 Abrir todos os 3 painéis no navegador
echo.
echo   [0] ❌ Sair
echo.
echo ==============================================================================
set /p opt="Digite o numero da opcao desejada [0-4]: "

if "%opt%"=="1" goto opt1
if "%opt%"=="2" goto opt2
if "%opt%"=="3" goto opt3
if "%opt%"=="4" goto opt4
if "%opt%"=="0" goto fim
goto menu

:opt1
echo.
echo [1/2] Abrindo navegador em http://localhost:5050...
start /b powershell -Command "Start-Sleep -Milliseconds 1200; Start-Process 'http://localhost:5050'"
echo [2/2] Iniciando Asclepio Notícias...
cd /d "%~dp0asclepio-noticias"
python app.py
pause
goto menu

:opt2
echo.
echo [1/2] Abrindo navegador em http://localhost:8765...
start /b powershell -Command "Start-Sleep -Milliseconds 1200; Start-Process 'http://localhost:8765'"
echo [2/2] Iniciando Calculadora de Tokens...
cd /d "%~dp0calculadora-tokens-gemini"
python app.py
pause
goto menu

:opt3
echo.
echo [1/2] Abrindo navegador em http://localhost:8080...
start /b powershell -Command "Start-Sleep -Milliseconds 1200; Start-Process 'http://localhost:8080'"
echo [2/2] Iniciando Redação Virtual Decifrando Dados 2D...
cd /d "%~dp0redacao-virtual"
python server.py 8080
pause
goto menu

:opt4
echo.
echo Abrindo os 3 projetos no navegador...
start "" "http://localhost:5050"
start "" "http://localhost:8765"
start "" "http://localhost:8080"
echo Abas abertas!
timeout /t 3 > nul
goto menu

:fim
echo Saindo do Hub Asclepio. Ate logo!
exit /b
