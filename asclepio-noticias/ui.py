"""
ui.py - Interface visual rica no terminal usando a biblioteca Rich
Projetado para excelente legibilidade, cores vivas e suporte completo a Windows UTF-8.
"""

import os
import sys
import webbrowser
from datetime import datetime
from typing import List, Optional

# Garante suporte adequado a UTF-8 no terminal Windows
if sys.platform == "win32":
    try:
        os.system("chcp 65001 > nul 2>&1")
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich.align import Align
from rich.prompt import Prompt

from fetcher import NewsItem, FEEDS

console = Console(highlight=False)

def get_source_badge(source: str) -> str:
    """Retorna uma tag colorida personalizada para os principais veículos nacionais e internacionais."""
    s_lower = source.lower()
    # Veículos Brasileiros
    if "g1" in s_lower or "globo" in s_lower:
        return f"[bold red on black] G1 [/bold red on black]"
    elif "cnn brasil" in s_lower:
        return f"[bold white on red] CNN BR [/bold white on red]"
    elif "cnn" in s_lower:
        return f"[bold white on red] CNN [/bold white on red]"
    elif "bbc news brasil" in s_lower or "bbc brasil" in s_lower:
        return f"[bold white on dark_red] BBC BR [/bold white on dark_red]"
    elif "bbc" in s_lower:
        return f"[bold white on dark_red] BBC [/bold white on dark_red]"
    elif "uol" in s_lower:
        return f"[bold black on yellow] UOL [/bold black on yellow]"
    elif "folha" in s_lower:
        return f"[bold white on blue] FOLHA [/bold white on blue]"
    elif "estadão" in s_lower or "estadao" in s_lower:
        return f"[bold blue]Estadão[/bold blue]"
    elif "poder360" in s_lower:
        return f"[bold magenta]Poder360[/bold magenta]"
    elif "reuters" in s_lower:
        return f"[bold bright_yellow]Reuters[/bold bright_yellow]"
    elif "bloomberg" in s_lower:
        return f"[bold bright_purple]Bloomberg[/bold bright_purple]"
    elif "metrópoles" in s_lower or "metropoles" in s_lower:
        return f"[bold bright_red]Metrópoles[/bold bright_red]"
    elif "tecmundo" in s_lower or "olhar digital" in s_lower:
        return f"[bold bright_cyan]{source}[/bold bright_cyan]"
    # Veículos Internacionais / Tech em Inglês
    elif "the verge" in s_lower or "verge" in s_lower:
        return f"[bold black on bright_cyan] VERGE [/bold black on bright_cyan]"
    elif "techcrunch" in s_lower:
        return f"[bold black on bright_green] TC [/bold black on bright_green]"
    elif "washington post" in s_lower:
        return f"[bold white on black] WASH POST [/bold white on black]"
    elif "new york times" in s_lower or "nyt" in s_lower:
        return f"[bold white on black] NYT [/bold white on black]"
    elif "wall street journal" in s_lower or "wsj" in s_lower:
        return f"[bold white on blue] WSJ [/bold white on blue]"
    elif "the guardian" in s_lower:
        return f"[bold white on dark_blue] GUARDIAN [/bold white on dark_blue]"
    elif "cnbc" in s_lower:
        return f"[bold white on dark_blue] CNBC [/bold white on dark_blue]"
    elif "forbes" in s_lower:
        return f"[bold white on dark_red] Forbes [/bold white on dark_red]"
    elif "wired" in s_lower:
        return f"[bold black on white] WIRED [/bold black on white]"
    elif "ars technica" in s_lower:
        return f"[bold red]ArsTechnica[/bold red]"
    elif "associated press" in s_lower or "ap news" in s_lower:
        return f"[bold white on red] AP [/bold white on red]"
    else:
        # Abrevia fontes excessivamente longas
        display_name = source[:15] + ".." if len(source) > 17 else source
        return f"[cyan]{display_name}[/cyan]"


def get_time_style(relative_time: str) -> str:
    """Aplica cores dinâmicas baseadas na urgência temporal da notícia."""
    if "agora" in relative_time or "now" in relative_time or ("s" in relative_time.split()[-1] and "dias" not in relative_time):
        return f"[bold bright_green]⚡ {relative_time}[/bold bright_green]"
    elif "min" in relative_time or "m ago" in relative_time:
        return f"[bold green]{relative_time}[/bold green]"
    elif "1h" in relative_time or "2h" in relative_time or "3h" in relative_time:
        return f"[yellow]{relative_time}[/yellow]"
    elif "ontem" in relative_time or "yesterday" in relative_time:
        return f"[dim yellow]{relative_time}[/dim yellow]"
    else:
        return f"[dim]{relative_time}[/dim]"


def show_banner(subtitle: str = "Buscador & Agregador de Notícias em Tempo Real"):
    """Exibe o cabeçalho estilizado do Radar de Notícias."""
    now_str = datetime.now().strftime("%d/%m/%Y às %H:%M:%S")
    banner_text = Text()
    banner_text.append("📡 RADAR DE NOTÍCIAS | BRASIL & MUNDO (PT & EN)\n", style="bold bright_cyan")
    banner_text.append(f"{subtitle} • Horário: {now_str}\n", style="dim white")
    banner_text.append("Fontes: Google News, G1, BBC, CNN, TechCrunch, The Verge, Reuters, Bloomberg, WSJ e mais", style="italic grey70")

    console.print(Panel(
        Align.center(banner_text),
        border_style="cyan",
        padding=(1, 2)
    ))


def display_news_table(items: List[NewsItem], title: str = "Últimas Notícias"):
    """Renderiza tabela elegante com a lista de notícias e opções numéricas."""
    if not items:
        console.print(Panel("[bold yellow]Nenhuma notícia encontrada para este filtro no momento.[/bold yellow]", border_style="yellow"))
        return

    table = Table(
        title=f"[bold white]{title}[/bold white] [dim]({len(items)} notícias coletadas)[/dim]",
        header_style="bold bright_white on grey23",
        border_style="grey37",
        expand=True,
        show_lines=True
    )

    table.add_column("#", justify="center", style="bold cyan", width=5)
    table.add_column("Idioma", justify="center", width=8)
    table.add_column("Fonte", justify="center", width=14)
    table.add_column("Título da Notícia", justify="left", ratio=6)
    table.add_column("Publicado", justify="right", width=16)

    for idx, item in enumerate(items, 1):
        num_str = f"[{idx}]"
        badge = get_source_badge(item.source)
        time_styled = get_time_style(item.relative_time)
        title_text = f"[bold white]{item.title}[/bold white]"
        lang_flag = "[green]🇧🇷 PT[/green]" if item.lang == "pt" else "[blue]🌐 EN[/blue]"

        table.add_row(num_str, lang_flag, badge, title_text, time_styled)

    console.print(table)
    console.print(
        "[dim]💡 Digite o número [bold cyan][1..N][/bold cyan] para abrir o artigo no navegador | "
        "[bold green][B][/bold green] Busca PT | [bold blue][E][/bold blue] Search EN | [bold magenta][T][/bold magenta] Busca Combinada | "
        "[bold yellow][R][/bold yellow] Atualizar | [bold red][0/Q][/bold red] Menu principal[/dim]\n"
    )


def show_item_details(item: NewsItem, idx: int):
    """Exibe modal com detalhes da notícia e opção de abrir no navegador."""
    content = Text()
    content.append(f"Título: {item.title}\n", style="bold white")
    lang_desc = "Português (Brasil)" if item.lang == "pt" else "English (Global / USA)"
    content.append(f"Fonte: {item.source}  |  Idioma: {lang_desc}  |  Categoria: {item.category}\n", style="cyan")
    content.append(f"Momento: {item.relative_time} ({item.published.strftime('%d/%m/%Y %H:%M:%S UTC') if item.published else 'N/A'})\n\n", style="dim")

    if item.summary:
        content.append(f"Resumo / Trecho:\n{item.summary}\n\n", style="italic grey82")

    content.append(f"Link Original:\n{item.link}", style="underline blue")

    console.print(Panel(content, title=f"Detalhes da Notícia #{idx}", border_style="green"))


def open_news_link(item: NewsItem):
    """Abre o link da notícia no navegador web padrão do usuário."""
    console.print(f"[bold green]Abrindo no navegador:[/bold green] {item.title}")
    try:
        webbrowser.open(item.link)
    except Exception as e:
        console.print(f"[bold red]Erro ao abrir navegador:[/bold red] {e}")


def display_menu() -> str:
    """Menu interativo principal em formato limpo e organizado por idioma."""
    table = Table(
        title="[bold bright_cyan]Escolha um Canal ou Modo de Busca[/bold bright_cyan]",
        header_style="bold grey70",
        border_style="cyan",
        expand=True
    )

    table.add_column("Opção", justify="center", style="bold yellow", width=7)
    table.add_column("Região", justify="center", width=10)
    table.add_column("Canal / Tópico", justify="left", ratio=3)
    table.add_column("Descrição", justify="left", ratio=5)

    options = [
        # Brasil & Português
        ("1", "[green]🇧🇷 PT[/green]", "Brasil - Últimas Notícias", "Principais manchetes e acontecimentos no Brasil"),
        ("2", "[green]🇧🇷 PT[/green]", "Mundo - Cobertura em Português", "Giro internacional traduzido e apurado em PT-BR"),
        ("3", "[green]🇧🇷 PT[/green]", "Economia & Negócios (BR)", "Mercado financeiro, Selic, dólar, bolsa e PIB"),
        ("4", "[green]🇧🇷 PT[/green]", "Tecnologia & IA (BR)", "Inovações, inteligência artificial e startups"),
        ("5", "[green]🇧🇷 PT[/green]", "Política Brasil", "Decisões de Brasília, Congresso, STF e governo"),
        ("6", "[green]🇧🇷 PT[/green]", "G1 Globo & BBC Brasil", "Feeds diretos dos maiores portais em PT"),

        # Internacional & Inglês
        ("7", "[blue]🌐 EN[/blue]", "World News (Global Headlines)", "Top global breaking news in English"),
        ("8", "[blue]🌐 EN[/blue]", "Tech & AI Global (Silicon Valley)", "OpenAI, Google, Nvidia, Apple, AI models & gadgets"),
        ("9", "[blue]🌐 EN[/blue]", "Business & Markets (Global)", "Wall Street, Federal Reserve, global finance & economy"),
        ("10", "[blue]🌐 EN[/blue]", "TechCrunch (Startups & AI)", "Exclusive tech funding, generative AI and Silicon Valley"),
        ("11", "[blue]🌐 EN[/blue]", "The Verge (Tech & Culture)", "Gadgets, software, big tech policies and reviews"),
        ("12", "[blue]🌐 EN[/blue]", "BBC World News (Direct Feed)", "Global investigative journalism and breaking stories"),

        # Ações e Buscas
        ("B", "[green]🔍 PT[/green]", "Buscar em Português", "Busque qualquer termo (ex: Petrobras, Selic, eleições)"),
        ("E", "[blue]🔍 EN[/blue]", "Search in English (Global / USA)", "Search any term in English (e.g. OpenAI, Nvidia, agents)"),
        ("T", "[magenta]🌍 ALL[/magenta]", "Busca Combinada (PT + EN)", "Busca simultânea em ambos os idiomas juntos"),
        ("M", "[yellow]⚡ LIVE[/yellow]", "Monitor Ao Vivo (Breaking News)", "Radar contínuo com alertas visuais no terminal"),
        ("Q", "[red]❌ SAIR[/red]", "Encerrar", "Fechar o Radar de Notícias")
    ]

    for opt, reg, canal, desc in options:
        table.add_row(opt, reg, canal, desc)

    console.print(table)
    choice = Prompt.ask("[bold cyan]Selecione uma opção[/bold cyan]", default="1").strip().upper()
    return choice
