"""
Rastreador Automatico de Consumo Real de Tokens (Antigravity / Gemini CLI)
Desenvolvido para Marlon Ferreira / Decifrando Dados.
Utiliza a tabela oficial de precificacao da documentacao (ai.google.dev/pricing).
Diferencia Input, Cache e Output (Thinking).
"""

import os
import glob
import json
import sys
import argparse
from datetime import datetime

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BRAIN_DIR = r"C:\Users\marlo\.gemini\antigravity-cli\brain"
DOLAR_PADRAO = 5.80

# Tabela Oficial Google AI Developers (ai.google.dev/pricing) por 1M tokens
PRECOS_OFICIAIS = {
    "Gemini 2.5 Pro": {
        "input_ate_200k": 1.25,
        "input_acima_200k": 2.50,
        "output_ate_200k": 10.00,
        "output_acima_200k": 15.00,
        "cache_ate_200k": 0.125,
        "cache_acima_200k": 0.250,
    },
    "Gemini 3.1 Pro Preview": {
        "input_ate_200k": 2.00,
        "input_acima_200k": 4.00,
        "output_ate_200k": 12.00,
        "output_acima_200k": 18.00,
        "cache_ate_200k": 0.20,
        "cache_acima_200k": 0.40,
    },
    "Gemini 2.5 Flash": {
        "input": 0.30,
        "output": 2.50,
        "cache": 0.03,
    },
    "Gemini 2.5 Flash-Lite": {
        "input": 0.10,
        "output": 0.40,
        "cache": 0.01,
    }
}

def format_tokens(n):
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.2f} Bilhões"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.2f} Milhões"
    if n >= 1_000:
        return f"{n / 1_000:.1f} Mil"
    return f"{n:,}"

def calcular_custo_oficial(input_t, cache_t, output_t, modelo="Gemini 2.5 Pro"):
    p = PRECOS_OFICIAIS[modelo]
    if "input_ate_200k" in p:
        custo_inp = (input_t / 1e6) * p["input_ate_200k"]
        custo_cache = (cache_t / 1e6) * p["cache_ate_200k"]
        custo_out = (output_t / 1e6) * p["output_ate_200k"]
    else:
        custo_inp = (input_t / 1e6) * p["input"]
        custo_cache = (cache_t / 1e6) * p["cache"]
        custo_out = (output_t / 1e6) * p["output"]
    return {
        "input_usd": custo_inp,
        "cache_usd": custo_cache,
        "output_usd": custo_out,
        "total_usd": custo_inp + custo_cache + custo_out
    }

def analisar_transcript(caminho_arquivo):
    total_input, total_output, total_cache, respostas = 0, 0, 0, 0
    if not os.path.exists(caminho_arquivo):
        return None
    try:
        with open(caminho_arquivo, "r", encoding="utf-8", errors="ignore") as f:
            for linha in f:
                linha = linha.strip()
                if not linha: continue
                try:
                    d = json.loads(linha)
                    if d.get("source") == "MODEL" and d.get("type") == "PLANNER_RESPONSE":
                        respostas += 1
                        total_input += d.get("input_tokens", 0)
                        total_output += d.get("output_tokens", 0)
                        total_cache += d.get("cache_read_tokens", 0)
                except Exception:
                    continue
    except Exception:
        return None

    return {
        "respostas": respostas,
        "input_tokens": total_input,
        "output_tokens": total_output,
        "cache_read_tokens": total_cache,
        "total_tokens": total_input + total_output + total_cache
    }

def exibir_relatorio(titulo, dados, dolar=DOLAR_PADRAO):
    c_pro = calcular_custo_oficial(dados["input_tokens"], dados["cache_read_tokens"], dados["output_tokens"], "Gemini 2.5 Pro")
    c_flash = calcular_custo_oficial(dados["input_tokens"], dados["cache_read_tokens"], dados["output_tokens"], "Gemini 2.5 Flash")

    print("=" * 70)
    print(f" 📡 {titulo}")
    print("=" * 70)
    print(f" - Interacoes do Modelo : {dados['respostas']} respostas")
    print(f" - Tokens de Entrada    : {dados['input_tokens']:,} ({format_tokens(dados['input_tokens'])})")
    print(f" - Tokens em Cache      : {dados['cache_read_tokens']:,} ({format_tokens(dados['cache_read_tokens'])})")
    print(f" - Tokens de Saida      : {dados['output_tokens']:,} ({format_tokens(dados['output_tokens'])})")
    print(f" - TOTAL PROCESSADO     : {dados['total_tokens']:,} ({format_tokens(dados['total_tokens'])})")
    print("-" * 70)
    print(" 🏷️  CUSTO OFICIAL SE COBRADO POR API (ai.google.dev/pricing):")
    print(f" • Se faturado como GEMINI 2.5 PRO:")
    print(f"   - Input  ($1.25/1M) : US$ {c_pro['input_usd']:.4f}")
    print(f"   - Cache  ($0.125/1M): US$ {c_pro['cache_usd']:.4f}")
    print(f"   - Output ($10.00/1M): US$ {c_pro['output_usd']:.4f}")
    print(f"   = TOTAL PRO API     : US$ {c_pro['total_usd']:.3f} (~ R$ {c_pro['total_usd'] * dolar:.2f})")
    print("-" * 70)
    print(f" • Se faturado como GEMINI 2.5 / 3.8 FLASH:")
    print(f"   - Input  ($0.30/1M) : US$ {c_flash['input_usd']:.4f}")
    print(f"   - Cache  ($0.03/1M) : US$ {c_flash['cache_usd']:.4f}")
    print(f"   - Output ($2.50/1M) : US$ {c_flash['output_usd']:.4f}")
    print(f"   = TOTAL FLASH API   : US$ {c_flash['total_usd']:.3f} (~ R$ {c_flash['total_usd'] * dolar:.2f})")
    print("-" * 70)
    print(" 💰 CUSTO PARA VOCE    : R$ 0,00 (100% coberto pela assinatura Google One)")
    print("=" * 70)

def monitorar_atual(conv_id=None):
    if conv_id:
        caminho = os.path.join(BRAIN_DIR, conv_id, ".system_generated", "logs", "transcript.jsonl")
    else:
        arquivos = glob.glob(os.path.join(BRAIN_DIR, "*", ".system_generated", "logs", "transcript.jsonl"))
        if not arquivos: return
        caminho = max(arquivos, key=os.path.getmtime)
        conv_id = os.path.basename(os.path.dirname(os.path.dirname(os.path.dirname(caminho))))

    dados = analisar_transcript(caminho)
    if dados:
        exibir_relatorio(f"CONSUMO DETALHADO - SESSAO ATIVA ({conv_id[:12]}...)", dados)

def monitorar_todas(limite_dias=2):
    arquivos = glob.glob(os.path.join(BRAIN_DIR, "*", ".system_generated", "logs", "transcript.jsonl"))
    total_geral = {"respostas": 0, "input_tokens": 0, "output_tokens": 0, "cache_read_tokens": 0, "total_tokens": 0}
    agora = datetime.now()
    conversas_contadas = 0

    for arq in arquivos:
        mtime = datetime.fromtimestamp(os.path.getmtime(arq))
        if (agora - mtime).days <= limite_dias:
            dados = analisar_transcript(arq)
            if dados and dados["respostas"] > 0:
                conversas_contadas += 1
                for k in total_geral:
                    total_geral[k] += dados[k]

    exibir_relatorio(f"CONSUMO CONSOLIDADO (ULTIMOS {limite_dias} DIAS - {conversas_contadas} CONVERSAS)", total_geral)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--conv_id", type=str, default=None)
    parser.add_argument("--todas", action="store_true")
    parser.add_argument("--dias", type=int, default=2)
    args = parser.parse_args()

    if args.todas:
        monitorar_todas(limite_dias=args.dias)
    else:
        monitorar_atual(conv_id=args.conv_id)

if __name__ == "__main__":
    main()
