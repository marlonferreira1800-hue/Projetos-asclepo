@echo off
title Asclepio Gateway
cd /d "%~dp0"
echo ===================================================
echo   Iniciando Asclepio Gateway e Control UI...
echo ===================================================
node bin/asclepio.mjs start
pause
