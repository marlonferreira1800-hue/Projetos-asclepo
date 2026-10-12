"""
monitor.py - Modo Radar Contínuo em Tempo Real (Breaking News Watcher)
Monitora feeds e alertas a cada N segundos, notificando no terminal quando
novas matérias surgem.
"""

import time
import sys
from datetime import datetime
from typing import Set

from rich.console import Console
from rich.panel import Panel
from rich.live import Live
from rich.table import Table

from fetcher import fetch_news, search_news, NewsItem
from ui import get_source_badge, get_time_style

console = Console(highlight=False)

def run_live_monitor(channel_or_query: str, is_search: bool = False, interval_seconds: int = 45):
    """
    Executa o monitor em tempo real no terminal.
    channel_or_query: chave da categoria (ex: 'brasil', 'mundo', 'tecnologia') ou termo de busca.
    """
    console.clear()
    title_label = f"Busca: '{channel_or_query}'" if is_search else f"Canal: {channel_or_query.upper()}"
    
    console.print(Panel(
        f"[bold bright_red]⚡ RADAR AO VIVO ATIVADO[/bold bright_red]\n"
        f"Monitorando em tempo real: [bold yellow]{title_label}[/bold yellow]\n"
        f"Intervalo de verificação: [cyan]{interval_seconds} segundos[/cyan]\n"
        f"[dim]Pressione [bold white]Ctrl+C[/bold white] a qualquer momento para pausar e retornar ao menu.[/dim]",
        border_style="red"
    ))

    # Conjunto de IDs ou títulos já visualizados
    seen_ids: Set[str] = set()

    # 1. Coleta inicial
    try:
        console.print("[dim]Carregando notícias iniciais...[/dim]")
        if is_search:
            initial_items = search_news(channel_or_query, limit=10)
        else:
            initial_items = fetch_news(channel_or_query, limit=10)

        for it in initial_items:
            seen_ids.add(it.title.strip().lower())

        table = Table(
            title=f"Últimas notícias conhecidas ({datetime.now().strftime('%H:%M:%S')})",
            border_style="grey37",
            expand=True
        )
        table.add_column("Fonte", width=14, justify="center")
        table.add_column("Título", justify="left")
        table.add_column("Horário", width=14, justify="right")

        for it in initial_items[:7]:
            table.add_row(get_source_badge(it.source), it.title, get_time_style(it.relative_time))

        console.print(table)
        console.print("\n[bold green]✓ Radar ativo. Aguardando novos despachos em tempo real...[/bold green]\n")

    except KeyboardInterrupt:
        console.print("\n[yellow]Monitor encerrado pelo usuário.[/yellow]")
        return
    except Exception as e:
        console.print(f"[bold red]Erro na carga inicial:[/bold red] {e}")

    # 2. Loop de monitoramento contínuo
    check_count = 0
    try:
        while True:
            # Contagem regressiva no terminal
            for remaining in range(interval_seconds, 0, -1):
                sys.stdout.write(f"\r[Radar Ao Vivo] Próxima varredura em {remaining}s... (Total verificações: {check_count})   ")
                sys.stdout.flush()
                time.sleep(1)

            check_count += 1
            now_str = datetime.now().strftime("%H:%M:%S")
            sys.stdout.write(f"\r[Radar Ao Vivo] Checando novas notícias ({now_str})...                       \n")
            sys.stdout.flush()

            try:
                if is_search:
                    current_items = search_news(channel_or_query, limit=10)
                else:
                    current_items = fetch_news(channel_or_query, limit=10)

                new_arrivals = []
                for it in current_items:
                    k = it.title.strip().lower()
                    if k not in seen_ids:
                        seen_ids.add(k)
                        new_arrivals.append(it)

                if new_arrivals:
                    for it in new_arrivals:
                        badge = get_source_badge(it.source)
                        alert_panel = Panel(
                            f"[bold bright_red]🚨 NOVO DESPACHO EM TEMPO REAL ({now_str})[/bold bright_red]\n"
                            f"Fonte: {badge}  |  Momento: {get_time_style(it.relative_time)}\n"
                            f"[bold white]{it.title}[/bold white]\n\n"
                            f"[underline blue]{it.link}[/underline blue]",
                            border_style="bright_red",
                            title="[bold yellow]★ BREAKING NEWS[/bold yellow]"
                        )
                        console.print(alert_panel)
                        # Emite sinal sonoro de terminal discreto se compatível
                        print("\a", end="")
                else:
                    console.print(f"[dim grey62]• [{now_str}] Nenhuma novidade no intervalo. Tudo calmo.[/dim grey62]")

            except Exception as e:
                console.print(f"[bold red]Erro na checagem do radar:[/bold red] {e}")

    except KeyboardInterrupt:
        console.print("\n\n[bold yellow]Radar ao vivo pausado. Retornando ao menu...[/bold yellow]\n")
        time.sleep(1)
