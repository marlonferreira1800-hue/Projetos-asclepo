"""
Formatador de Tokens Estilo OpenCode CLI (opencode stats)
Configurado exclusivamente para a Assinatura GOOGLE PRO (Google One AI Premium / Gemini Pro).
"""

import sys
import os
import glob
import json

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BRAIN_DIR = r"C:\Users\marlo\.gemini\antigravity-cli\brain"

def format_tokens(n):
    if n >= 1_000_000_000:
        return f"{n / 1e9:.2f}B"
    if n >= 1_000_000:
        return f"{n / 1e6:.2f}M"
    if n >= 1_000:
        return f"{n / 1e3:.1f}k"
    return str(n)

def gerar_tabela_opencode():
    arquivos = glob.glob(os.path.join(BRAIN_DIR, "*", ".system_generated", "logs", "transcript.jsonl"))
    if not arquivos:
        print("Nenhum dado encontrado.")
        return

    mais_recente = max(arquivos, key=os.path.getmtime)
    
    sessao_inp, sessao_cache, sessao_out, sessao_turns = 0, 0, 0, 0
    with open(mais_recente, "r", encoding="utf-8", errors="ignore") as f:
        for l in f:
            if not l.strip(): continue
            try:
                d = json.loads(l)
                if d.get("source") == "MODEL" and d.get("type") == "PLANNER_RESPONSE":
                    sessao_turns += 1
                    sessao_inp += d.get("input_tokens", 0)
                    sessao_out += d.get("output_tokens", 0)
                    sessao_cache += d.get("cache_read_tokens", 0)
            except Exception:
                pass

    tot_tokens = sessao_inp + sessao_cache + sessao_out
    # Calculo Oficial Gemini 2.5 Pro da Documentacao ($1.25 Inp, $0.125 Cache, $10.00 Out)
    cost_pro_usd = (sessao_inp / 1e6 * 1.25) + (sessao_cache / 1e6 * 0.125) + (sessao_out / 1e6 * 10.00)
    cost_pro_brl = cost_pro_usd * 5.80
    cache_efficiency = (sessao_cache / tot_tokens * 100) if tot_tokens > 0 else 0

    print("\n" + "─" * 74)
    print("  OPENCODE STATS  •  ASSINATURA GOOGLE PRO (AI PREMIUM)")
    print("─" * 74)
    print(f"  Plano Ativo     : Google One AI Pro (Mensalidade Fixa R$ 96,99)")
    print(f"  Session ID      : {os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(mais_recente))))[:16]}...")
    print(f"  Turns no Pro    : {sessao_turns} respostas")
    print(f"  Cache Hit Ratio : {cache_efficiency:.1f}% (Eficiência de Prompt Caching)")
    print("─" * 74)
    
    # Tabela com foco no modelo Pro da assinatura
    print("┌────────────────────────┬───────────┬───────────┬───────────┬───────────┬────────────┐")
    print("│ Modelo / Plano         │ Input     │ Cache Read│ Output    │ Total     │ Valor API  │")
    print("├────────────────────────┼───────────┼───────────┼───────────┼───────────┼────────────┤")
    print(f"│ Gemini 2.5 Pro (Seu)   │ {format_tokens(sessao_inp):<9} │ {format_tokens(sessao_cache):<9} │ {format_tokens(sessao_out):<9} │ {format_tokens(tot_tokens):<9} │ ${cost_pro_usd:<9.2f} │")
    print("└────────────────────────┴───────────┴───────────┴───────────┴───────────┴────────────┘")
    
    print("\n  RESUMO DA SUA COTA PRO:")
    print(f"   • Tokens de Entrada : {sessao_inp:,} tokens (prompts + arquivos lidos)")
    print(f"   • Tokens em Cache   : {sessao_cache:,} tokens (reaproveitados na memória)")
    print(f"   • Tokens de Saída   : {sessao_out:,} tokens (respostas geradas)")
    print(f"   • TOTAL PROCESSADO  : {tot_tokens:,} tokens ({format_tokens(tot_tokens)})")
    print(f"   • Custo na API Pro  : US$ {cost_pro_usd:.2f} (~ R$ {cost_pro_brl:.2f})")
    print(f"   • COBRANÇA PARA VOCÊ: R$ 0,00 (100% incluso na sua assinatura Google Pro)")
    print("─" * 74 + "\n")

if __name__ == "__main__":
    gerar_tabela_opencode()
