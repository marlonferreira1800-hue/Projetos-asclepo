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
echo   [4] 🌐 Asclepio Navegador Autônomo (Clonagem Polar Browser)
echo       Interface: Aplicacao Desktop Electron (Chromium + IA)
echo       Descricao: Navegador com agente autonomo, fallback multimodelo e aura azul
echo.
echo   [5] ⚡ Asclepio Agente Autônomo & Gateway (Clone OpenClaw)
echo       Porta: http://localhost:18888
echo       Descricao: Agente ReAct autônomo com auto-cura, 10 ferramentas e NVIDIA NIM
echo.
echo   [6] 📚 Tradutor Editorial de Livros & E-books (Antigravity Gemini)
echo       Interface: CLI com Checkpoint e Paralelismo (workers=2)
echo       Descricao: Tradução integral de livros (EPUB/PDF) com sumário, imagens e layout
echo.
echo   [7] 🚀 Abrir todos os projetos
echo.
echo   [0] ❌ Sair
echo.
echo ==============================================================================
set /p opt="Digite o numero da opcao desejada [0-7]: "

if "%opt%"=="1" goto opt1
if "%opt%"=="2" goto opt2
if "%opt%"=="3" goto opt3
if "%opt%"=="4" goto opt4
if "%opt%"=="5" goto opt5
if "%opt%"=="6" goto opt6
if "%opt%"=="7" goto opt7
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
echo Iniciando Asclepio Browser (Next-Gen Polar Architecture)...
if exist "%~dp0asclepio-browser" (
    cd /d "%~dp0asclepio-browser"
    if not exist node_modules (
        echo Instalando dependencias do Electron + Vite...
        call npm install
    )
    if not exist .env (
        if exist .env.example copy .env.example .env > nul
    )
    call npm run dev
) else (
    cd /d "%~dp0asclepio-navegador"
    if not exist node_modules (
        echo Instalando dependencias do Electron...
        call npm install
    )
    call npm start
)
pause
goto menu

:opt5
echo.
echo [1/2] Abrindo painel de controle em http://localhost:18888...
start /b powershell -Command "Start-Sleep -Milliseconds 1500; Start-Process 'http://localhost:18888'"
echo [2/2] Iniciando Asclepio Agente Autônomo & Gateway...
cd /d "%~dp0asclepio-agente-autonomo"
call INICIAR_ASCLEPIO.bat
pause
goto menu

:opt6
echo.
echo Iniciando Tradutor Editorial de Livros...
cd /d "%~dp0tradutor-editorial-livros"
call TRADUZIR_COM_ANTIGRAVITY.bat
pause
goto menu

:opt7
echo.
echo Abrindo todos os projetos do ecossistema Asclepio...
start "" "http://localhost:5050"
start "" "http://localhost:8765"
start "" "http://localhost:8080"
start "" "%~dp04_iniciar_navegador.bat"
start "" "%~dp05_iniciar_agente_autonomo.bat"
start "" "%~dp06_iniciar_tradutor.bat"
echo Todos os 6 projetos disparados!
timeout /t 3 > nul
goto menu

:fim
echo Saindo do Hub Asclepio. Ate logo!
exit /b
