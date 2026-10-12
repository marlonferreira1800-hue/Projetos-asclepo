"""
Barra de Gasto de Tokens Ao Vivo no Terminal
Configurado especificamente para a Assinatura GOOGLE PRO (Google One AI Premium / Gemini Pro).
Aplica os precos oficiais do Gemini Pro ($1.25 Input, $0.125 Cache, $10.00 Output).
"""

import sys
import os
import glob
import json
import time

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BRAIN_DIR = r"C:\Users\marlo\.gemini\antigravity-cli\brain"
MAX_CONTEXT = 1_000_000  # Janela de 1 Milhao de Tokens do Gemini Pro

# Cores ANSI
RESET = "\033[0m"
BOLD = "\033[1m"
GREEN = "\033[32m"
YELLOW = "\033[33m"
CYAN = "\033[36m"
MAGENTA = "\033[35m"
ORANGE = "\033[38;5;208m"
DIM = "\033[2m"

def render_bar(pct, width=35):
    filled = int(width * (pct / 100.0))
    filled = min(width, max(0, filled))
    empty = width - filled
    if pct < 50:
        cor = GREEN
    elif pct < 80:
        cor = YELLOW
    else:
        cor = ORANGE
    return f"{cor}{'█' * filled}{DIM}{'░' * empty}{RESET}"

def format_num(n):
    if n >= 1_000_000:
        return f"{n/1e6:.2f}M"
    if n >= 1_000:
        return f"{n/1e3:.1f}k"
    return str(n)

def obter_dados():
    arquivos = glob.glob(os.path.join(BRAIN_DIR, "*", ".system_generated", "logs", "transcript.jsonl"))
    if not arquivos:
        return None
    mais_recente = max(arquivos, key=os.path.getmtime)
    conv_id = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(mais_recente))))

    inp, cache, out, turns = 0, 0, 0, 0
    ultimo_inp = 0
    ultimo_cache = 0

    with open(mais_recente, "r", encoding="utf-8", errors="ignore") as f:
        for l in f:
            if not l.strip(): continue
            try:
                d = json.loads(l)
                if d.get("source") == "MODEL" and d.get("type") == "PLANNER_RESPONSE":
                    turns += 1
                    step_inp = d.get("input_tokens", 0)
                    step_cache = d.get("cache_read_tokens", 0)
                    step_out = d.get("output_tokens", 0)
                    inp += step_inp
                    cache += step_cache
                    out += step_out
                    ultimo_inp = step_inp
                    ultimo_cache = step_cache
            except Exception:
                pass

    tot = inp + cache + out
    ctx_ativo = ultimo_inp + ultimo_cache
    
    # CALCULO EXCLUSIVO GEMINI PRO (Tabela Oficial da Documentacao):
    # Input: $1.25/1M | Cache: $0.125/1M | Output: $10.00/1M
    cost_pro_usd = (inp / 1e6 * 1.25) + (cache / 1e6 * 0.125) + (out / 1e6 * 10.00)
    cost_pro_brl = cost_pro_usd * 5.80
    cache_ratio = (cache / tot * 100) if tot > 0 else 0

    return {
        "conv_id": conv_id,
        "turns": turns,
        "ctx_ativo": ctx_ativo,
        "pct_contexto": (ctx_ativo / MAX_CONTEXT) * 100,
        "total": tot,
        "input": inp,
        "cache": cache,
        "output": out,
        "cache_ratio": cache_ratio,
        "cost_pro_usd": cost_pro_usd,
        "cost_pro_brl": cost_pro_brl
    }

def print_status(d):
    barra = render_bar(d["pct_contexto"], width=32)
    print("\n" + "═" * 70)
    print(f" {BOLD}{MAGENTA}💎 GOOGLE PRO (AI PREMIUM){RESET}  •  {BOLD}{CYAN}LIVE CONTEXT & TOKEN MONITOR{RESET}")
    print(f" {DIM}Plano: Google One AI Pro (R$ 96,99/mês)  •  Sessão: {d['conv_id'][:12]}...{RESET}")
    print("═" * 70)
    print(f" Contexto Pro   : [{barra}] {BOLD}{d['pct_contexto']:.1f}%{RESET}")
    print(f" Memória em Uso : {BOLD}{format_num(d['ctx_ativo'])}{RESET} / 1.00M tokens  ({(MAX_CONTEXT - d['ctx_ativo'])/1e3:.0f}k livres na janela)")
    print("─" * 70)
    print(f" • Interações   : {BOLD}{d['turns']}{RESET} respostas no modelo Pro")
    print(f" • Reuso Cache  : {BOLD}{GREEN}{d['cache_ratio']:.1f}%{RESET} ({format_num(d['cache'])} tokens recuperados)")
    print(f" • Total Sessão : {BOLD}{format_num(d['total'])}{RESET} tokens ({d['total']:,})")
    print(f" • Valor API Pro: {BOLD}{YELLOW}US$ {d['cost_pro_usd']:.2f}{RESET} (~ {BOLD}R$ {d['cost_pro_brl']:.2f}{RESET})")
    print(f" • Sua Fatura   : {BOLD}{GREEN}R$ 0,00 adicional{RESET} (100% incluso na assinatura Pro)")
    print("═" * 70 + "\n")

def main():
    once = "--once" in sys.argv
    if once:
        d = obter_dados()
        if d: print_status(d)
        return

    print(f"\n{CYAN}Iniciando monitor ao vivo da sua Assinatura Pro... (Ctrl+C para sair){RESET}")
    try:
        while True:
            os.system("cls" if os.name == "nt" else "clear")
            d = obter_dados()
            if d:
                print_status(d)
                print(f" {DIM}● Atualizando automaticamente a cada 1.5s com sua cota Pro...{RESET}")
            time.sleep(1.5)
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Monitor Pro encerrado.{RESET}")

if __name__ == "__main__":
    main()
