"""
app.py - Servidor Web do ASCLEPIO NOTÍCIAS
Inicia uma aplicação web moderna no navegador padrão em http://localhost:5050.
"""

import os
import sys
import threading
import time
import webbrowser
from flask import Flask, render_template, request, jsonify

# Garante suporte UTF-8 no Windows
if sys.platform == "win32":
    try:
        os.system("chcp 65001 > nul 2>&1")
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8")
        if hasattr(sys.stderr, "reconfigure"):
            sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from fetcher import fetch_news, search_news, search_world_bilingual, FEEDS

app = Flask(__name__)

PORT = 5050
HOST = "127.0.0.1"


@app.route("/")
def index():
    """Página principal da interface web Asclepio Notícias."""
    return render_template("index.html")


@app.route("/api/news")
def api_news():
    """Retorna notícias por categoria."""
    cat = request.args.get("category", "brasil").lower()
    limit = int(request.args.get("limit", 20))
    cfg = FEEDS.get(cat, FEEDS["brasil"])

    items = fetch_news(cat, limit=limit)
    return jsonify({
        "status": "success",
        "category": cat,
        "title": cfg.get("name", "Notícias"),
        "count": len(items),
        "items": [it.to_dict() for it in items]
    })


@app.route("/api/search")
def api_search():
    """Busca notícias por termo em PT ou EN."""
    q = request.args.get("q", "").strip()
    lang = request.args.get("lang", "pt").lower()
    limit = int(request.args.get("limit", 20))

    if not q:
        return jsonify({"status": "error", "message": "Termo de busca vazio", "items": []})

    items = search_news(q, lang=lang, limit=limit)
    return jsonify({
        "status": "success",
        "query": q,
        "lang": lang,
        "count": len(items),
        "items": [it.to_dict() for it in items]
    })


@app.route("/api/world-search")
def api_world_search():
    """Busca Mundial 360° com tradução simultânea em Português e Inglês."""
    q = request.args.get("q", "").strip()
    limit = int(request.args.get("limit", 20))

    if not q:
        return jsonify({"status": "error", "message": "Termo de busca vazio", "items": []})

    items, pt_t, en_t = search_world_bilingual(q, limit=limit)
    return jsonify({
        "status": "success",
        "query": q,
        "pt_term": pt_t,
        "en_term": en_t,
        "count": len(items),
        "items": [it.to_dict() for it in items]
    })


@app.route("/api/categories")
def api_categories():
    """Retorna todas as categorias disponíveis."""
    cats = [
        {"key": k, "name": v["name"], "category": v["category"], "lang": v.get("lang", "pt")}
        for k, v in FEEDS.items()
    ]
    return jsonify({"status": "success", "categories": cats})


def open_browser():
    """Abre o navegador após 1 segundo de inicialização do servidor."""
    time.sleep(1.2)
    url = f"http://localhost:{PORT}"
    print(f"\n⚡ ASCLEPIO NOTÍCIAS aberto no navegador: {url}\n")
    try:
        webbrowser.open(url)
    except Exception as e:
        print(f"Erro ao abrir navegador automaticamente: {e}")


if __name__ == "__main__":
    print("=" * 70)
    print("  ⚡ ASCLEPIO NOTÍCIAS | RADAR GLOBAL EM TEMPO REAL")
    print(f"  Servidor iniciado em: http://localhost:{PORT}")
    print("  Pressione Ctrl+C no terminal para encerrar o servidor.")
    print("=" * 70)

    # Inicia abertura do navegador em segundo plano
    threading.Thread(target=open_browser, daemon=True).start()

    # Roda o servidor Flask
    app.run(host=HOST, port=PORT, debug=False)
