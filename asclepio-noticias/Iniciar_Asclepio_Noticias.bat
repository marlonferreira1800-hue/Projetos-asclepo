@echo off
title Asclepio Notícias - Radar Global Web
chcp 65001 > nul
echo ======================================================================
echo    ⚡ INICIANDO ASCLEPIO NOTÍCIAS NO NAVEGADOR
echo ======================================================================
echo.
echo Abrindo em http://localhost:5050 no seu navegador padrao...
echo.
python "%~dp0app.py"
pause
