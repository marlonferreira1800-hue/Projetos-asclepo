# Tabela Oficial de Precificação da API Google Gemini

Fonte Oficial: [Google AI for Developers - Pricing](https://ai.google.dev/pricing)  
*Última atualização: 2026*

---

## 1. Preços por Milhão de Tokens (USD)

| Modelo | Input (&le; 200k) | Context Caching | Output (incl. Thinking) | Janela Máxima |
|---|---|---|---|---|
| **Gemini 2.5 Pro** *(Padrão Gemini Advanced)* | **$1.25** | **$0.125** | **$10.00** | 2.000.000 tokens |
| **Gemini 3.1 Pro Preview** | **$2.00** | **$0.200** | **$12.00** | 1.000.000 tokens |
| **Gemini 2.5 / 3.8 Flash** | **$0.30** | **$0.030** | **$2.50** | 1.000.000 tokens |
| **Gemini 2.5 Flash-Lite** | **$0.10** | **$0.010** | **$0.40** | 1.000.000 tokens |

---

## 2. Regra Fundamental de Cálculo (Segregação de Tokens)

A API do Gemini **não cobra todos os tokens pelo mesmo preço**:
- **Output Tokens (Respostas e Raciocínio/Thinking):** Custam **8x mais** que o input no Pro ($10.00 vs $1.25).
- **Context Caching (Histórico Reutilizado):** Custa **90% menos** que o input ($0.125 vs $1.25). No Antigravity, como o histórico de código é mantido e reusado a cada mensagem, a maior parte do tráfego vira **cache hit**.
- **Input Tokens (Novas Instruções e Arquivos Injetados):** Cobrados a $1.25 / 1M.

### Fórmula Precisa:
$$\text{Custo Total (USD)} = \left(\frac{\text{Input}}{10^6} \times \$1.25\right) + \left(\frac{\text{Cache}}{10^6} \times \$0.125\right) + \left(\frac{\text{Output}}{10^6} \times \$10.00\right)$$
