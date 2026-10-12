# 🪙 Calculadora de Tokens Gemini Pro & Console de Telemetria

Ferramenta completa para **monitorar, calcular e visualizar o consumo de tokens** das sessões do Antigravity e Gemini CLI em tempo real, com equivalência de custos oficiais da Google AI Developers e telemetria turno-a-turno.

---

## 🚀 Como Executar

### 1. 🌐 Studio Web (Dashboard no Navegador)
Para abrir o painel completo no navegador:

```powershell
python app.py
```
*Ou dê 2 cliques no arquivo:*
`iniciar.bat`

Acesse no navegador: **`http://127.0.0.1:8765/`**

O painel exibe:
- 📊 Gráficos de telemetria turno-a-turno (Input, Cache Read, Output).
- 💾 Utilização da janela de contexto (1M/2M tokens) e memória ativa.
- 💵 Custo acumulado em Dólar (USD) e Real (BRL) baseado na tabela oficial do Google.
- 📜 Histórico de conversas e transcrições da sessão atual.

---

### 2. 💻 Terminal CLI & Barra ao Vivo

Dentro da pasta `scripts/`:

#### 🟢 Barra de Contexto Ao Vivo no Terminal:
Atualiza dinamicamente no terminal enquanto você interage com o agente:
```powershell
python scripts/live_bar.py
```

Exemplo visual:
```text
════════════════════════════════════════════════════════════════════
 📡 GEMINI LIVE CONTEXT MONITOR  •  Session: 3986937e-70b...
════════════════════════════════════════════════════════════════════
 Contexto Ativo : [██████░░░░░░░░░░░░░░░░░░░░░░░░░░] 22.4%
 Memória em Uso : 224.1k / 1.00M tokens  (775k livres)
────────────────────────────────────────────────────────────────────
 • Interações   : 48 respostas processadas
 • Cache Hit    : 92.1% de reuso (8.40M tokens)
 • Total Sessão : 9.12M tokens
 • Custo API    : US$ 0.65 (~ R$ 3.75)  •  Plano Google One: R$ 0,00
════════════════════════════════════════════════════════════════════
```

#### 📊 Tabela Detalhada (Padrão OpenCode CLI):
```powershell
python scripts/opencode_stats.py
```

#### 🔢 Cálculo Instantâneo de Tokens:
```powershell
python scripts/calcular_tokens.py
```

---

## 📋 Tabela de Preços Oficiais Suportados (Google AI Developers)
- **Gemini 2.5 Pro:** US$ 1.25 (Input) | US$ 0.125 (Cache) | US$ 10.00 (Output) / 1M tokens
- **Gemini 3.1 Pro Preview:** US$ 2.00 (Input) | US$ 0.20 (Cache) | US$ 12.00 (Output) / 1M tokens
- **Gemini 2.5 / 3.8 Flash:** US$ 0.30 (Input) | US$ 0.03 (Cache) | US$ 2.50 (Output) / 1M tokens
- **Gemini Flash-Lite:** US$ 0.10 (Input) | US$ 0.01 (Cache) | US$ 0.40 (Output) / 1M tokens
