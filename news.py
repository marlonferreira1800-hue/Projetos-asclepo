"""
news.py - Aplicativo Principal do Radar de Notícias em Tempo Real
Permite navegação interativa no terminal ou execução rápida via linha de comando (CLI),
com suporte completo a notícias e buscas em Português e Inglês.
"""

import argparse
import json
import sys
from typing import List, Optional

from rich.console import Console
from rich.prompt import Prompt

from fetcher import fetch_news, search_news, FEEDS, NewsItem
from ui import (
    show_banner,
    display_news_table,
    show_item_details,
    open_news_link,
    display_menu,
    console
)
from monitor import run_live_monitor


def handle_news_interaction(
    items: List[NewsItem],
    title: str,
    category_key: Optional[str] = None,
    search_term: Optional[str] = None,
    search_lang: str = "pt"
):
    """Loop de interação com a lista de notícias (abrir links, buscar ou voltar)."""
    current_items = items
    while True:
        console.clear()
        show_banner(subtitle=f"Visualizando: {title}")
        display_news_table(current_items, title=title)

        action = Prompt.ask("[bold cyan]Comando[/bold cyan]", default="0").strip().lower()

        if action in ["0", "q", "v", "voltar", "sair"]:
            break

        elif action == "r":
            with console.status("[bold green]Atualizando notícias em tempo real...[/bold green]"):
                if search_term:
                    current_items = search_news(search_term, lang=search_lang, limit=len(current_items))
                elif category_key:
                    current_items = fetch_news(category_key, limit=len(current_items))
                else:
                    current_items = fetch_news("brasil", limit=len(current_items))
            continue

        elif action == "b":
            termo = Prompt.ask("[bold green]Digite o termo de busca em Português (BR)[/bold green]").strip()
            if termo:
                with console.status(f"[bold green]Buscando notícias (PT) sobre '{termo}'...[/bold green]"):
                    res = search_news(termo, lang="pt", limit=20)
                handle_news_interaction(res, title=f"Busca PT: '{termo}'", search_term=termo, search_lang="pt")
                break

        elif action == "e":
            termo = Prompt.ask("[bold blue]Enter search query in English (Global / US)[/bold blue]").strip()
            if termo:
                with console.status(f"[bold blue]Searching English news for '{termo}'...[/bold blue]"):
                    res = search_news(termo, lang="en", limit=20)
                handle_news_interaction(res, title=f"Search EN: '{termo}'", search_term=termo, search_lang="en")
                break

        elif action == "t":
            termo = Prompt.ask("[bold magenta]Digite o termo para Busca Combinada (PT + EN)[/bold magenta]").strip()
            if termo:
                with console.status(f"[bold magenta]Buscando notícias globais (PT + EN) para '{termo}'...[/bold magenta]"):
                    res = search_news(termo, lang="both", limit=20)
                handle_news_interaction(res, title=f"Busca Global (PT + EN): '{termo}'", search_term=termo, search_lang="both")
                break

        elif action == "m":
            if search_term:
                run_live_monitor(search_term, is_search=True)
            elif category_key:
                run_live_monitor(category_key, is_search=False)
            else:
                run_live_monitor("brasil", is_search=False)
            break

        elif action.isdigit():
            idx = int(action)
            if 1 <= idx <= len(current_items):
                selected = current_items[idx - 1]
                console.print(f"\n[bold green]➜ Selecionado #[{idx}]:[/bold green] {selected.title}")
                show_item_details(selected, idx)

                sub_opt = Prompt.ask(
                    "[bold yellow][O] Abrir no navegador | [Enter/V] Voltar à lista[/bold yellow]",
                    choices=["o", "v", "b", "e", ""],
                    default="o"
                ).lower()

                if sub_opt == "o":
                    open_news_link(selected)
            else:
                console.print(f"[bold red]Número inválido! Escolha entre 1 e {len(current_items)}.[/bold red]")
                Prompt.ask("[dim]Pressione Enter para continuar...[/dim]")
        else:
            console.print("[yellow]Opção não reconhecida.[/yellow]")


def run_interactive():
    """Modo de menu interativo amigável no terminal."""
    category_map = {
        # Brasil & Português
        "1": ("brasil", "Brasil - Últimas Notícias"),
        "2": ("mundo", "Mundo - Cobertura em Português"),
        "3": ("economia", "Economia & Negócios (BR)"),
        "4": ("tecnologia", "Tecnologia & IA (BR)"),
        "5": ("politica", "Política Brasil"),
        "6": ("g1", "G1 Globo (Feed Direto)"),

        # Internacional & Inglês
        "7": ("mundo_en", "World News - Global Top Stories (EN)"),
        "8": ("tech_en", "Tech & AI Global - Silicon Valley (EN)"),
        "9": ("business_en", "Business & Markets Global (EN)"),
        "10": ("techcrunch", "TechCrunch - Startups & AI (EN)"),
        "11": ("theverge", "The Verge - Tech & Culture (EN)"),
        "12": ("bbc_world", "BBC World News - Direct (EN)")
    }

    while True:
        console.clear()
        show_banner()
        choice = display_menu()

        if choice in ["Q", "0", "SAIR", "EXIT"]:
            console.print("\n[bold cyan]Até logo! Mantenha-se bem informado.[/bold cyan]\n")
            break

        elif choice == "B":
            termo = Prompt.ask("[bold green]Digite o termo de busca em Português[/bold green]").strip()
            if termo:
                with console.status(f"[bold green]Varrendo notícias sobre '{termo}'...[/bold green]"):
                    items = search_news(termo, lang="pt", limit=20)
                handle_news_interaction(items, title=f"Busca PT: '{termo}'", search_term=termo, search_lang="pt")

        elif choice == "E":
            termo = Prompt.ask("[bold blue]Enter search query in English (Global / USA)[/bold blue]").strip()
            if termo:
                with console.status(f"[bold blue]Scanning global feeds for '{termo}'...[/bold blue]"):
                    items = search_news(termo, lang="en", limit=20)
                handle_news_interaction(items, title=f"Search EN: '{termo}'", search_term=termo, search_lang="en")

        elif choice == "T":
            termo = Prompt.ask("[bold magenta]Digite o termo para Busca Combinada (PT + EN)[/bold magenta]").strip()
            if termo:
                with console.status(f"[bold magenta]Buscando notícias no Brasil e no Mundo sobre '{termo}'...[/bold magenta]"):
                    items = search_news(termo, lang="both", limit=20)
                handle_news_interaction(items, title=f"Busca Combinada (PT + EN): '{termo}'", search_term=termo, search_lang="both")

        elif choice == "M":
            console.print("\n[bold cyan]Escolha o canal para o Monitor Ao Vivo:[/bold cyan]")
            console.print("1. Brasil | 2. Mundo (PT) | 3. Tech & AI (EN) | 4. World News (EN) | 5. Palavra-chave livre")
            sub = Prompt.ask("Opção do Monitor", choices=["1", "2", "3", "4", "5"], default="1")

            mapping = {"1": "brasil", "2": "mundo", "3": "tech_en", "4": "mundo_en"}
            if sub in mapping:
                run_live_monitor(mapping[sub], is_search=False)
            else:
                termo = Prompt.ask("Digite a palavra-chave para monitorar").strip()
                if termo:
                    run_live_monitor(termo, is_search=True)

        elif choice in category_map:
            cat_key, cat_label = category_map[choice]
            with console.status(f"[bold green]Carregando {cat_label} em tempo real...[/bold green]"):
                items = fetch_news(cat_key, limit=20)
            handle_news_interaction(items, title=cat_label, category_key=cat_key)

        else:
            console.print("[bold red]Opção inválida! Escolha um dos itens do menu.[/bold red]")
            Prompt.ask("[dim]Pressione Enter para continuar...[/dim]")


def main():
    parser = argparse.ArgumentParser(
        description="Radar de Notícias - Buscador e agregador de notícias em tempo real no terminal (PT & EN)"
    )
    # Canais Brasil & PT
    parser.add_argument("--brasil", action="store_true", help="Exibe as últimas notícias do Brasil")
    parser.add_argument("--mundo", action="store_true", help="Exibe notícias internacionais em português")
    parser.add_argument("--tech", action="store_true", help="Exibe notícias de Tecnologia & IA (BR)")
    parser.add_argument("--economia", action="store_true", help="Exibe notícias de Economia & Negócios (BR)")
    parser.add_argument("--politica", action="store_true", help="Exibe notícias de Política Brasil")

    # Canais Internacionais em Inglês
    parser.add_argument("--world-en", action="store_true", help="Top global news headlines in English")
    parser.add_argument("--tech-en", action="store_true", help="Global Tech & AI news (Silicon Valley / English)")
    parser.add_argument("--business-en", action="store_true", help="Global Business & Markets news in English")
    parser.add_argument("--techcrunch", action="store_true", help="Latest news directly from TechCrunch")
    parser.add_argument("--theverge", action="store_true", help="Latest news directly from The Verge")
    parser.add_argument("--bbc-world", action="store_true", help="Latest news directly from BBC World News")

    # Buscas e Idiomas
    parser.add_argument("--busca", "-b", type=str, help="Busca notícias em tempo real por palavra-chave")
    parser.add_argument("--busca-en", type=str, help="Busca notícias em inglês por palavra-chave (Global / US)")
    parser.add_argument("--busca-global", type=str, help="Busca combinada em português e inglês simultaneamente")
    parser.add_argument("--lang", type=str, choices=["pt", "en", "both"], default="pt", help="Idioma para busca: pt, en ou both (padrão: pt)")
    parser.add_argument("--en", action="store_true", help="Atalho para forçar busca ou exibição em inglês")

    # Controle e Monitor
    parser.add_argument("--monitor", "-m", type=str, help="Inicia o monitor ao vivo (canal ou termo de busca)")
    parser.add_argument("--intervalo", "-i", type=int, default=45, help="Intervalo em segundos para o monitor (padrão: 45)")
    parser.add_argument("--limite", "-l", type=int, default=15, help="Quantidade máxima de notícias a exibir (padrão: 15)")
    parser.add_argument("--json", action="store_true", help="Exporta o resultado em formato JSON para automação")

    args = parser.parse_args()

    # Se nenhum argumento for passado, entra no modo interativo
    has_action = any([
        args.brasil, args.mundo, args.tech, args.economia, args.politica,
        args.world_en, args.tech_en, args.business_en, args.techcrunch, args.theverge, args.bbc_world,
        args.busca, args.busca_en, args.busca_global, args.monitor
    ])
    if not has_action:
        run_interactive()
        return

    # Execução direta via argumentos CLI
    items: List[NewsItem] = []
    title = "Notícias"

    if args.monitor:
        is_query = args.monitor.lower() not in FEEDS
        run_live_monitor(args.monitor, is_search=is_query, interval_seconds=args.intervalo)
        return

    # Idioma efetivo para buscas
    effective_lang = "en" if args.en else args.lang

    if args.busca_en:
        title = f"Search (EN): '{args.busca_en}'"
        items = search_news(args.busca_en, lang="en", limit=args.limite)
    elif args.busca_global:
        title = f"Busca Global (PT + EN): '{args.busca_global}'"
        items = search_news(args.busca_global, lang="both", limit=args.limite)
    elif args.busca:
        title = f"Busca ({effective_lang.upper()}): '{args.busca}'"
        items = search_news(args.busca, lang=effective_lang, limit=args.limite)

    # Canais Brasil / PT
    elif args.brasil:
        title = "Brasil - Últimas Notícias"
        items = fetch_news("brasil", limit=args.limite)
    elif args.mundo:
        title = "Mundo - Cobertura em Português"
        items = fetch_news("mundo", limit=args.limite)
    elif args.tech:
        title = "Tecnologia & IA (BR)"
        items = fetch_news("tecnologia", limit=args.limite)
    elif args.economia:
        title = "Economia & Negócios (BR)"
        items = fetch_news("economia", limit=args.limite)
    elif args.politica:
        title = "Política Brasil"
        items = fetch_news("politica", limit=args.limite)

    # Canais Internacionais / EN
    elif args.world_en:
        title = "World News - Global Top Stories (EN)"
        items = fetch_news("mundo_en", limit=args.limite)
    elif args.tech_en:
        title = "Tech & AI - Silicon Valley / Global (EN)"
        items = fetch_news("tech_en", limit=args.limite)
    elif args.business_en:
        title = "Business & Markets Global (EN)"
        items = fetch_news("business_en", limit=args.limite)
    elif args.techcrunch:
        title = "TechCrunch (Startups & AI)"
        items = fetch_news("techcrunch", limit=args.limite)
    elif args.theverge:
        title = "The Verge (Tech & Culture)"
        items = fetch_news("theverge", limit=args.limite)
    elif args.bbc_world:
        title = "BBC World News (EN)"
        items = fetch_news("bbc_world", limit=args.limite)

    if args.json:
        data = [
            {
                "id": it.id,
                "title": it.title,
                "source": it.source,
                "link": it.link,
                "lang": it.lang,
                "relative_time": it.relative_time,
                "published_iso": it.published.isoformat() if it.published else None,
                "summary": it.summary,
                "category": it.category
            }
            for it in items
        ]
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        show_banner()
        display_news_table(items, title=title)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nPrograma finalizado.")
        sys.exit(0)
