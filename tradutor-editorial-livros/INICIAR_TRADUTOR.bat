@echo off
chcp 65001 > nul
title Agente Tradutor Editorial de Livros - Gemini

echo ===============================================================================
echo         🤖 AGENTE TRADUTOR EDITORIAL DE LIVROS & DOCUMENTOS LONGOS
echo                        Desenvolvido com Google Gemini
echo ===============================================================================
echo.
echo Formatos suportados: .EPUB (Recomendado) ^| .PDF ^| .MD ^| .TXT
echo.

cd /d "%~dp0"

if "%~1"=="" (
    python agente_tradutor.py
) else (
    python agente_tradutor.py --livro "%~1"
)

echo.
pause
