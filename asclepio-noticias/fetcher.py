"""
fetcher.py - Motor de coleta RSS em tempo real para o Asclepio Notícias
Suporta Brasil, Mundo, Tecnologia, Economia, Feeds Internacionais e Busca Mundial 360°.
"""

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
import html
import json
import re
import time
import urllib.parse
import urllib.request
from typing import List, Optional, Tuple, Dict, Any
import feedparser

@dataclass
class NewsItem:
    id: str
    title: str
    source: str
    link: str
    published: Optional[datetime]
    relative_time: str
    summary: str
    category: str
    lang: str = "pt"

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["published_iso"] = self.published.isoformat() if self.published else None
        return d


FEEDS = {
    # Canais Brasil e Português
    "brasil": {
        "name": "Brasil - Principais Manchetes",
        "url": "https://news.google.com/rss?hl=pt-BR&gl=BR&ceid=BR:pt-419",
        "category": "Brasil",
        "lang": "pt"
    },
    "mundo": {
        "name": "Mundo - Cobertura em Português",
        "url": "https://news.google.com/rss/headlines/section/topic/WORLD?hl=pt-BR&gl=BR&ceid=BR:pt-419",
        "category": "Mundo (PT)",
        "lang": "pt"
    },
    "economia": {
        "name": "Economia & Negócios",
        "url": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=pt-BR&gl=BR&ceid=BR:pt-419",
        "category": "Economia",
        "lang": "pt"
    },
    "tecnologia": {
        "name": "Tecnologia & IA (BR)",
        "url": "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=pt-BR&gl=BR&ceid=BR:pt-419",
        "category": "Tecnologia",
        "lang": "pt"
    },
    "politica": {
        "name": "Política Brasil",
        "url": "https://news.google.com/rss/headlines/section/topic/POLITICS?hl=pt-BR&gl=BR&ceid=BR:pt-419",
        "category": "Política",
        "lang": "pt"
    },
    "g1": {
        "name": "G1 Globo (Direto)",
        "url": "https://g1.globo.com/rss/g1/",
        "category": "G1",
        "lang": "pt"
    },
    "bbc_br": {
        "name": "BBC News Brasil (Direto)",
        "url": "https://feeds.bbci.co.uk/portuguese/rss.xml",
        "category": "BBC Brasil",
        "lang": "pt"
    },
    "cnn_br": {
        "name": "CNN Brasil (Direto)",
        "url": "https://www.cnnbrasil.com.br/feed/",
        "category": "CNN Brasil",
        "lang": "pt"
    },

    # Canais Globais em Inglês
    "mundo_en": {
        "name": "World News (Global Top Stories)",
        "url": "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en",
        "category": "World (EN)",
        "lang": "en"
    },
    "tech_en": {
        "name": "Tech & AI Global (Silicon Valley)",
        "url": "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
        "category": "Tech (EN)",
        "lang": "en"
    },
    "business_en": {
        "name": "Business & Markets Global",
        "url": "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
        "category": "Markets (EN)",
        "lang": "en"
    },
    "techcrunch": {
        "name": "TechCrunch (Startups & VC)",
        "url": "https://techcrunch.com/feed/",
        "category": "TechCrunch",
        "lang": "en"
    },
    "theverge": {
        "name": "The Verge (Tech & Culture)",
        "url": "https://www.theverge.com/rss/index.xml",
        "category": "The Verge",
        "lang": "en"
    },
    "bbc_world": {
        "name": "BBC World News (Direto)",
        "url": "http://feeds.bbci.co.uk/news/world/rss.xml",
        "category": "BBC World",
        "lang": "en"
    }
}


def clean_html(text: str) -> str:
    """Remove tags HTML e decodifica entidades para texto limpo."""
    if not text:
        return ""
    clean = re.sub(r"<.*?>", "", text)
    return html.unescape(clean).strip()


def format_relative_time(pub_dt: Optional[datetime], lang: str = "pt") -> str:
    """Calcula tempo relativo amigável em português ou inglês."""
    if not pub_dt:
        return "recente" if lang == "pt" else "recent"
    now = datetime.now(timezone.utc)
    diff = now - pub_dt
    total_seconds = int(diff.total_seconds())

    if total_seconds < 0 or total_seconds < 60:
        return "agora mesmo" if lang == "pt" else "just now"
    minutes = total_seconds // 60
    if minutes < 60:
        return f"há {minutes} min" if lang == "pt" else f"{minutes}m ago"
    hours = minutes // 60
    if hours < 24:
        rem_min = minutes % 60
        if rem_min > 0 and hours < 4:
            return f"há {hours}h {rem_min}m" if lang == "pt" else f"{hours}h {rem_min}m ago"
        return f"há {hours}h" if lang == "pt" else f"{hours}h ago"
    days = hours // 24
    if days == 1:
        return "ontem" if lang == "pt" else "yesterday"
    if days < 7:
        return f"há {days} dias" if lang == "pt" else f"{days}d ago"
    return pub_dt.strftime("%d/%m %H:%M")


def parse_feed_entries(
    feed_url: str,
    default_category: str,
    limit: int = 20,
    lang: str = "pt",
    default_source: str = ""
) -> List[NewsItem]:
    """Lê um feed RSS e retorna lista padronizada de NewsItem."""
    parsed = feedparser.parse(feed_url)
    items: List[NewsItem] = []
    seen_titles = set()

    for entry in parsed.entries:
        raw_title = html.unescape(getattr(entry, "title", "Sem título")).strip()
        link = getattr(entry, "link", "")
        if not raw_title or not link:
            continue

        source = default_source if default_source else ("News" if lang == "en" else "Notícias")
        if hasattr(entry, "source") and isinstance(entry.source, dict) and entry.source.get("title"):
            source = entry.source.get("title").strip()
            suffix = f" - {source}"
            if raw_title.endswith(suffix):
                raw_title = raw_title[:-len(suffix)].strip()
        elif " - " in raw_title:
            parts = raw_title.rsplit(" - ", 1)
            if len(parts[1]) < 40 and not any(p in parts[1].lower() for p in ["saiba", "veja", "confira", "read", "watch"]):
                raw_title = parts[0].strip()
                source = parts[1].strip()

        title_norm = raw_title.lower()[:60]
        if title_norm in seen_titles:
            continue
        seen_titles.add(title_norm)

        pub_dt = None
        if hasattr(entry, "published_parsed") and entry.published_parsed:
            try:
                pub_dt = datetime.fromtimestamp(time.mktime(entry.published_parsed), tz=timezone.utc)
            except Exception:
                pub_dt = None

        summary = clean_html(getattr(entry, "summary", "") or getattr(entry, "description", ""))
        if summary.lower() == raw_title.lower():
            summary = ""

        entry_id = getattr(entry, "id", "") or link

        item = NewsItem(
            id=entry_id,
            title=raw_title,
            source=source,
            link=link,
            published=pub_dt,
            relative_time=format_relative_time(pub_dt, lang=lang),
            summary=summary,
            category=default_category,
            lang=lang
        )
        items.append(item)

        if len(items) >= limit:
            break

    items.sort(key=lambda x: x.published or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return items


def fetch_news(category_key: str, limit: int = 15) -> List[NewsItem]:
    """Coleta notícias por categoria pré-definida."""
    cfg = FEEDS.get(category_key, FEEDS["brasil"])
    feed_source = cfg.get("category", "")
    return parse_feed_entries(
        cfg["url"],
        default_category=cfg["category"],
        limit=limit,
        lang=cfg.get("lang", "pt"),
        default_source=feed_source
    )


def auto_translate(text: str, target_lang: str = "en") -> str:
    """Traduz termos de busca entre português e inglês sem chaves de API."""
    try:
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl={target_lang}&dt=t&q=" + urllib.parse.quote(text.strip())
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=4) as response:
            data = json.loads(response.read().decode("utf-8"))
            translated = "".join([part[0] for part in data[0] if part[0]])
            return translated.strip() if translated else text
    except Exception:
        return text


def search_news(query: str, lang: str = "pt", limit: int = 20) -> List[NewsItem]:
    """Busca notícias em tempo real por termo em PT ou EN."""
    query = query.strip()
    if not query:
        return []

    q_encoded = urllib.parse.quote(query)

    if lang.lower() in ["en", "us", "uk", "ingles", "inglês"]:
        url = f"https://news.google.com/rss/search?q={q_encoded}&hl=en-US&gl=US&ceid=US:en"
        cat = f"Search (EN): '{query}'"
        return parse_feed_entries(url, default_category=cat, limit=limit, lang="en")
    else:
        url = f"https://news.google.com/rss/search?q={q_encoded}&hl=pt-BR&gl=BR&ceid=BR:pt-419"
        cat = f"Busca (PT): '{query}'"
        return parse_feed_entries(url, default_category=cat, limit=limit, lang="pt")


def search_world_bilingual(query: str, limit: int = 20) -> Tuple[List[NewsItem], str, str]:
    """
    Busca Mundial 360° no Mundo Todo: Varre simultaneamente em Português e Inglês,
    traduzindo o termo para obter a cobertura global completa de agências e portais.
    """
    query = query.strip()
    if not query:
        return [], "", ""

    en_term = auto_translate(query, target_lang="en")
    pt_term = auto_translate(query, target_lang="pt")

    if en_term.lower() == pt_term.lower():
        en_term = query
        pt_term = query

    half = max(6, limit // 2)

    # 1. Busca em Português
    items_pt = search_news(pt_term, lang="pt", limit=half)

    # 2. Busca Global em Inglês
    items_en = search_news(en_term, lang="en", limit=half)

    combined = []
    seen_titles = set()
    for item in items_pt + items_en:
        norm = item.title.lower()[:50]
        if norm not in seen_titles:
            seen_titles.add(norm)
            combined.append(item)

    combined.sort(key=lambda x: x.published or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    return combined[:limit], pt_term, en_term
