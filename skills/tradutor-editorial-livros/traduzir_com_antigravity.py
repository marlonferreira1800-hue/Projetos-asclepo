#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Motor de Tradução Editorial Integrado com Antigravity (Google One / Gemini Advanced)
Usa o motor de IA nativo da assinatura do Antigravity via CLI local (agy.exe)
Zero dependência de chaves de API externas ou cotas de desenvolvedor.
Suporta processamento concorrente seguro com checkpoint contínuo e tradução do Sumário (TOC).
"""

import os
import sys
import json
import time
import re
import threading
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Força codificação UTF-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from rich.console import Console
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn, TimeRemainingColumn

console = Console(force_terminal=True, legacy_windows=False)

# Importa módulos do extrator
from agente_tradutor import ExtratorEPUB, GerenciadorCheckpoint

AGY_PATH = r"C:\Users\marlo\AppData\Local\agy\bin\agy.exe"

TOC_TRANSLATION_MAP = {
    "COVER": "Capa",
    "TITLE PAGE": "Folha de Rosto",
    "COPYRIGHT": "Direitos Autorais",
    "DEDICATION": "Dedicatória",
    "FOREWORD": "Prefácio",
    "chapter one INTRODUCTION TO DEEP MEDICINE": "Capítulo 1: Introdução à Medicina Profunda",
    "chapter two SHALLOW MEDICINE": "Capítulo 2: Medicina Superficial",
    "chapter three MEDICAL DIAGNOSIS": "Capítulo 3: Diagnóstico Médico",
    "chapter four THE SKINNY ON DEEP LEARNING": "Capítulo 4: O Essencial sobre o Aprendizado Profundo",
    "chapter five DEEP LIABILITIES": "Capítulo 5: Responsabilidades e Riscos Profundos",
    "chapter six DOCTORS AND PATTERNS": "Capítulo 6: Médicos e Padrões",
    "chapter seven CLINICIANS WITHOUT PATTERNS": "Capítulo 7: Clínicos sem Padrões",
    "chapter eight MENTAL HEALTH": "Capítulo 8: Saúde Mental",
    "chapter nine AI AND HEALTH SYSTEMS": "Capítulo 9: IA e Sistemas de Saúde",
    "chapter ten DEEP DISCOVERY": "Capítulo 10: Descoberta Profunda",
    "chapter eleven DEEP DIET": "Capítulo 11: Dieta Profunda",
    "chapter twelve THE VIRTUAL MEDICAL ASSISTANT": "Capítulo 12: O Assistente Médico Virtual",
    "chapter thirteen DEEP EMPATHY": "Capítulo 13: Empatia Profunda",
    "ACKNOWLEDGMENTS": "Agradecimentos",
    "ABOUT THE AUTHOR": "Sobre o Autor",
    "ALSO BY ERIC TOPOL": "Outras Obras de Eric Topol",
    "NOTES": "Notas",
    "INDEX": "Índice Remissivo"
}

def traduzir_bloco_antigravity(bloco_html: str, glossario_str: str, contexto_anterior: str = "", max_tentativas: int = 2) -> str:
    """Executa a tradução usando a IA nativa do Antigravity (sem API key)."""
    
    prompt = f"""Você é um Tradutor Editorial Especialista de altíssimo nível, vertendo do Inglês para o Português do Brasil (PT-BR).

ATENÇÃO: NÃO use ferramentas, comandos ou chamadas de busca externa. Apenas processe e verta o texto diretamente.

REGRAS INEGOCIÁVEIS:
1. TRADUÇÃO INTEGRAL E COMPLETA: NUNCA resuma, sintetize ou corte parágrafos.
2. PRESERVAÇÃO RIGOROSA DE HTML: Mantenha exatamente todas as tags HTML (<p>, <h1>, <h2>, <h3>, <div>, <span>, <a>, <img>, id, class, href). Traduza APENAS o conteúdo de texto visível dentro das tags (notas, referências, títulos).
3. GLOSSÁRIO EDITORIAL: Siga rigorosamente este guia:
{glossario_str}

[CONTEXTO RECENTE JÁ TRADUZIDO (Apenas para continuidade)]:
{contexto_anterior[-600:] if contexto_anterior else "Início da obra."}

---
[TRECHO EM INGLÊS PARA TRADUÇÃO COMPLETA]:
{bloco_html}

Retorne EXCLUSIVAMENTE o HTML traduzido, sem introduções, sem notas e sem cercar com blocos ```html ou markdown.
"""

    for tentativa in range(1, max_tentativas + 1):
        try:
            res = subprocess.run(
                [AGY_PATH, "--dangerously-skip-permissions", "-p", prompt],
                capture_output=True,
                text=True,
                encoding="utf-8",
                timeout=360
            )
            
            t = res.stdout.strip()
            # Limpa possíveis blocos ```html ... ```
            if t.startswith("```html") and t.endswith("```"):
                t = t[7:-3].strip()
            elif t.startswith("```") and t.endswith("```"):
                t = t[3:-3].strip()
            elif "```html" in t:
                # Procura bloco html interno
                match = re.search(r"```(?:html)?\s*(.*?)\s*```", t, re.DOTALL)
                if match:
                    t = match.group(1).strip()
            
            # Se a resposta tiver tamanho razoável (pelo menos 30% do original ou contiver tags)
            if t and (len(t) >= min(100, len(bloco_html) * 0.3) or "<" in t):
                return t
            
            console.print(f"[yellow]Tentativa {tentativa} retornou texto muito curto ({len(t)} chars). Retentando...[/yellow]")
            time.sleep(2)
        except Exception as e:
            console.print(f"[red]Erro na chamada agy (tentativa {tentativa}): {e}[/red]")
            time.sleep(3)
            
    return ""

def traduzir_toc_recursivo(toc):
    """Traduz os títulos dos itens do Sumário NCX / EPUB."""
    for item in toc:
        if isinstance(item, (list, tuple)):
            sec, children = item
            if getattr(sec, 'title', None) and sec.title in TOC_TRANSLATION_MAP:
                sec.title = TOC_TRANSLATION_MAP[sec.title]
            traduzir_toc_recursivo(children)
        else:
            if getattr(item, 'title', None) and item.title in TOC_TRANSLATION_MAP:
                item.title = TOC_TRANSLATION_MAP[item.title]

def executar_traducao_antigravity(livro_path: str, limite: int = None, workers: int = 2):
    p_livro = Path(livro_path).resolve()
    nome_base = p_livro.stem
    pasta_destino = p_livro.parent
    
    caminho_glossario = pasta_destino / f"glossario_{nome_base}.json"
    caminho_checkpoint = pasta_destino / f"checkpoint_{nome_base}.json"
    saida_epub = pasta_destino / f"{nome_base}_PTBR.epub"

    console.print(Panel.fit(
        f"[bold cyan]⚡ MOTOR DE TRADUÇÃO EDITORIAL NATIVO DO ANTIGRAVITY[/bold cyan]\n"
        f"[dim]Execução direta via Engine Local • {workers} Workers Concorrentes • Checkpoint Contínuo[/dim]\n\n"
        f"📖 [bold white]Obra:[/bold white] {p_livro.name}",
        border_style="cyan"
    ))

    livro_epub = ExtratorEPUB.carregar_livro(str(p_livro))
    tarefas, _ = ExtratorEPUB.extrair_unidades_traducao(livro_epub)

    with open(caminho_glossario, "r", encoding="utf-8") as f:
        glossario = json.load(f)
    glossario_str = json.dumps(glossario, ensure_ascii=False, indent=2)

    checkpoint = GerenciadorCheckpoint(
        caminho_checkpoint=caminho_checkpoint,
        total_blocos=len(tarefas),
        metadata={"formato": "epub", "livro": p_livro.name, "motor": "antigravity_native"}
    )

    restantes = [t for t in tarefas if not checkpoint.obter_bloco_traduzido(t["id"])]
    console.print(f"[green]✓ Já concluídos no checkpoint:[/green] {len(tarefas) - len(restantes)}/{len(tarefas)}")
    console.print(f"[yellow]⏳ Restantes para traduzir com o Antigravity:[/yellow] {len(restantes)}")

    if limite:
        restantes = restantes[:limite]
        console.print(f"[cyan]Executando lote de {len(restantes)} tarefas...[/cyan]")

    if not restantes:
        console.print("[bold green]Todos os blocos já foram traduzidos![/bold green]")
    else:
        lock = threading.Lock()
        concluidos_lote = 0
        total_a_processar = len(restantes)

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=console
        ) as progress:
            task_bar = progress.add_task("[cyan]Traduzindo com IA da Assinatura...", total=total_a_processar)

            def processar_item(item):
                nonlocal concluidos_lote
                
                # Contexto anterior se disponível
                contexto_anterior = ""
                # Procura no checkpoint o bloco anterior se houver
                
                t0 = time.time()
                traducao = traduzir_bloco_antigravity(item["html"], glossario_str, contexto_anterior)
                dt = time.time() - t0
                
                if traducao:
                    with lock:
                        checkpoint.salvar_bloco(item["id"], traducao)
                        concluidos_lote += 1
                        n_total = len(checkpoint.obter_mapa_completo())
                        console.print(f"[green]✓ [{concluidos_lote}/{total_a_processar}] Salvo:[/green] {item['id']} ({dt:.1f}s) • Total Global: {n_total}/{len(tarefas)}")
                    return True
                else:
                    console.print(f"[red]✗ Falha ao obter tradução para {item['id']}[/red]")
                    return False

            with ThreadPoolExecutor(max_workers=workers) as executor:
                futures = {executor.submit(processar_item, item): item for item in restantes}
                for future in as_completed(futures):
                    progress.update(task_bar, advance=1)
                    with lock:
                        if concluidos_lote > 0 and concluidos_lote % 6 == 0 and concluidos_lote < total_a_processar:
                            try:
                                mapa_parcial = checkpoint.obter_mapa_completo()
                                ExtratorEPUB.reconstruir_e_salvar_epub(livro_epub, mapa_parcial, str(saida_epub))
                                console.print(f"[cyan]💾 Snapshot intermediário do EPUB salvo ({concluidos_lote}/{total_a_processar})![/cyan]")
                            except Exception:
                                pass

    # Reconstitui e salva o EPUB final
    console.print("\n[cyan]📚 Reconstruindo e salvando arquivo EPUB final...[/cyan]")
    mapa_completo = checkpoint.obter_mapa_completo()
    
    # Aplica tradução do Sumário nos metadados do EPUB
    try:
        traduzir_toc_recursivo(livro_epub.toc)
        console.print("[green]✓ Sumário (TOC) vertido para Português do Brasil![/green]")
    except Exception as e:
        console.print(f"[yellow]Aviso ao traduzir TOC: {e}[/yellow]")

    ExtratorEPUB.reconstruir_e_salvar_epub(livro_epub, mapa_completo, str(saida_epub))

    console.print()
    console.print(Panel.fit(
        f"[bold green]✨ EPUB ATUALIZADO COM SUCESSO PELO ANTIGRAVITY![/bold green]\n\n"
        f"📕 [bold]Arquivo Final:[/bold] {saida_epub}\n"
        f"💾 [bold]Total de Blocos no Checkpoint:[/bold] {len(mapa_completo)}/{len(tarefas)}",
        border_style="green"
    ))

if __name__ == "__main__":
    limite = int(sys.argv[1]) if len(sys.argv) > 1 else None
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    executar_traducao_antigravity(r"c:\Users\marlo\Downloads\Deep Medicine by eric topol.epub", limite=limite, workers=workers)
