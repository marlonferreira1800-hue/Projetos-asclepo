@echo off
title Teste do Asclepio
cd /d "%~dp0"
echo ===================================================
echo   Executando Doctor e Status do Asclepio...
echo ===================================================
node bin/asclepio.mjs doctor
echo.
node bin/asclepio.mjs status
echo.
pause
