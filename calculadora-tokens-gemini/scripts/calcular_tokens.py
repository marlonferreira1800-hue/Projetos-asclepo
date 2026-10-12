"""
Calculadora de Consumo e ROI de Tokens do Gemini Pro / Advanced
Desenvolvido para Marlon Ferreira / Decifrando Dados.
"""

import argparse
import sys

# Garante suporte a UTF-8 no Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

def format_number(val: float) -> str:
    if val >= 1_000_000_000:
        return f"{val / 1_000_000_000:.2f} Bilhões"
    elif val >= 1_000_000:
        return f"{val / 1_000_000:.2f} Milhões"
    elif val >= 1_000:
        return f"{val / 1_000:.2f} Mil"
    return f"{val:.0f}"

def calcular(
    msgs_por_bloco: int = 45,        # 40-50 msgs a cada 3h
    blocos_por_dia: int = 8,         # 24h / 3h = 8 blocos (ou intensidade ajustável)
    tokens_por_msg: int = 100_000,   # Média de contexto/prompt
    dias: int = 30,
    preco_api_usd_por_milhao: float = 1.25, # Gemini Pro 1M tokens input
    taxa_dolar: float = 5.80,
    preco_assinatura_brl: float = 96.99
):
    msgs_dia = msgs_por_bloco * blocos_por_dia
    tokens_dia = msgs_dia * tokens_por_msg
    tokens_periodo = tokens_dia * dias

    # Custo equivalente caso fosse pago via API
    custo_api_usd = (tokens_periodo / 1_000_000) * preco_api_usd_por_milhao
    custo_api_brl = custo_api_usd * taxa_dolar
    economia_brl = custo_api_brl - preco_assinatura_brl
    roi_percentual = (custo_api_brl / preco_assinatura_brl) * 100 if preco_assinatura_brl > 0 else 0

    print("=" * 65)
    print(" [*] RELATORIO DE COTA E CONSUMO - GEMINI PRO (GOOGLE ONE AI)")
    print("=" * 65)
    print(f" - Mensagens por bloco (3h) : {msgs_por_bloco} mensagens")
    print(f" - Blocos ativos por dia     : {blocos_por_dia} blocos ({msgs_dia} msgs/dia)")
    print(f" - Media de Tokens/Interacao : {tokens_por_msg:,} tokens ({format_number(tokens_por_msg)})")
    print(f" - Periodo de analise        : {dias} dias")
    print("-" * 65)
    print(" [>] TOTAL DE TOKENS PROCESSADOS:")
    print(f" - Por Bloco (3 horas)       : {format_number(msgs_por_bloco * tokens_por_msg)} tokens")
    print(f" - Por Dia (24 horas)        : {format_number(tokens_dia)} tokens")
    print(f" - No Periodo ({dias} dias)      : {format_number(tokens_periodo)} tokens")
    print("-" * 65)
    print(" [$] COMPARATIVO FINANCEIRO (VALOR vs ASSINATURA):")
    print(f" - Custo da Assinatura Fixa  : R$ {preco_assinatura_brl:.2f}/mes")
    print(f" - Valor equivalente na API  : US$ {custo_api_usd:,.2f} (~ R$ {custo_api_brl:,.2f})")
    print(f" - Economia estimada         : R$ {economia_brl:,.2f}")
    print(f" - Retorno sobre Plano (ROI) : {roi_percentual:,.1f}% de valor entregue")
    print("=" * 65)

def main():
    parser = argparse.ArgumentParser(description="Calculadora de Cota e Tokens Gemini Pro")
    parser.add_argument("--msgs_bloco", type=int, default=45, help="Mensagens por bloco de 3h (padrao: 45)")
    parser.add_argument("--blocos_dia", type=int, default=8, help="Numero de blocos de 3h usados por dia (padrao: 8)")
    parser.add_argument("--tokens_msg", type=int, default=100_000, help="Tokens medios por mensagem (padrao: 100.000)")
    parser.add_argument("--dias", type=int, default=30, help="Periodo em dias (padrao: 30)")
    parser.add_argument("--preco_api", type=float, default=1.25, help="Preco por 1M tokens na API em USD (padrao: 1.25)")
    parser.add_argument("--dolar", type=float, default=5.80, help="Cotacao do dolar USD/BRL (padrao: 5.80)")
    parser.add_argument("--assinatura", type=float, default=96.99, help="Valor mensal da assinatura em BRL (padrao: 96.99)")

    args = parser.parse_args()
    calcular(
        msgs_por_bloco=args.msgs_bloco,
        blocos_por_dia=args.blocos_dia,
        tokens_por_msg=args.tokens_msg,
        dias=args.dias,
        preco_api_usd_por_milhao=args.preco_api,
        taxa_dolar=args.dolar,
        preco_assinatura_brl=args.assinatura
    )

if __name__ == "__main__":
    main()
