# ⚡ Decifrando Dados — Redação Virtual 2D

Painel web interativo estilo RPG 16-bit / pixel art top-down para visualização e simulação em tempo real da equipe de agentes de Inteligência Artificial trabalhando na newsletter oficial **Decifrando Dados** (curadoria de **Marlon Ferreira**).

Inspirado na filosofia **"The BRIEF"** (*"Smart people are cooler"* — ágil, pop-tech, sem corporatiquês).

---

## 🎮 Demonstração Visual & Comportamento dos Agentes

O escritório virtual simula a redação completa com 5 estações de trabalho, área de descompressão/café, sala de reuniões e lousa de pautas:

- **⚡ Estado `"working"` (Trabalhando):**
  - O agente navega suavemente por corredores (sem atravessar paredes ou móveis) até sua bancada designada.
  - Senta na cadeira de escritório voltado para o monitor.
  - O monitor acende com animação de código e dados em tempo real.
  - Um balão flutuante com ícone de teclado (`⌨️`) e partículas de código/números (`01`, `</>`, `py`, `sql`) sobem sobre a cabeça do agente.
  - Som 8-bit sutil de digitação (opcional).

- **☕ Estado `"idle"` (Ocioso / Café):**
  - O agente caminha até o lounge de café, senta no sofá retrô ou vai até a máquina de espresso.
  - A cafeteira solta fumaça animada e o bebedouro borbulha.
  - Um balão com xícara de café fumegante (`☕`) flutua com movimento senoidal suave.

- **❓ Estado `"waiting"` (Aguardando Feedback):**
  - O agente para ou se volta para o centro da redação.
  - Um balão de diálogo de RPG clássico com ponto de interrogação pulsante (`❓`) aparece sobre sua cabeça, aguardando aprovação editorial.

---

## 🛠️ Arquitetura Técnica

```
decifrando-dados/redacao-virtual/
│
├── server.py              # Backend Python (aiohttp, WebSocket full-duplex e REST API)
│
└── public/
    ├── index.html         # Painel Web responsivo com HUD, logs e controle de simulação
    ├── style.css          # Estilos retrô modernos (scanlines CRT, tipografia pixel, dark mode)
    └── game.js            # Motor Canvas 2D (tilemap procedural, waypoints, LERP e áudio 8-bit)
```

### 1. Backend (`server.py`)
- Desenvolvido em **Python 3.12** assíncrono com `aiohttp`.
- Serve arquivos estáticos e gerencia canal WebSocket em `ws://localhost:8080/ws`.
- Possui motor de simulação orgânica em background (`asyncio`) que alterna os agentes conforme o ciclo de vida de produção da newsletter.
- Disponibiliza endpoints REST para controle manual ou integração com pipelines externos.

### 2. Frontend (`public/game.js` & `public/index.html`)
- **HTML5 Canvas 2D nativo** a 60 FPS com `imageSmoothingEnabled = false` para estética pixel-art 16-bit ultra nítida.
- **Interpolação de Movimento (LERP):** Deslocamento suave entre waypoints e cálculo de rota para evitar colisões com móveis.
- **Web Audio API:** Sintetizador procedural embutido de efeitos sonoros 8-bit (sem dependência de arquivos externos de áudio).
- **Filtro CRT Scanlines:** Efeito de monitor arcade dos anos 90 ativável com 1 clique.

---

## 🚀 Como Executar

### 1. Iniciar o Servidor
No terminal, a partir da pasta raiz do projeto:

```powershell
python decifrando-dados\redacao-virtual\server.py
```

Por padrão, o servidor iniciará em `http://localhost:8080`. Se desejar usar outra porta:

```powershell
python decifrando-dados\redacao-virtual\server.py 3000
```

### 2. Abrir no Navegador
Acesse:
👉 **[http://localhost:8080](http://localhost:8080)**

---

## 📡 Arquitetura de Dados (JSON)

### Estrutura dos Agentes

Cada agente segue rigorosamente a estrutura base solicitada:

```json
{
  "id": "agente_01",
  "nome": "Agente Curador (Pautas & The BRIEF)",
  "status": "working"
}
```

No ecossistema da **Decifrando Dados**, o payload inclui metadados editoriais úteis:

```json
[
  {
    "id": "agente_01",
    "nome": "Agente Curador (Pautas & The BRIEF)",
    "role": "Curador & Hunter",
    "status": "working",
    "desk_id": 0,
    "color": "#3B82F6",
    "avatar": "curador",
    "activity": "Minerando efemérides históricas e tendências de IA..."
  },
  {
    "id": "agente_02",
    "nome": "Agente Redator (Pop-Tech & Copy)",
    "role": "Redator Pop-Tech",
    "status": "working",
    "desk_id": 1,
    "color": "#10B981",
    "avatar": "redator",
    "activity": "Escrevendo Matéria de Capa: 'Smart people are cooler'..."
  },
  {
    "id": "agente_03",
    "nome": "Agente Dados & Fact-Checker",
    "role": "Métricas & Validação",
    "status": "waiting",
    "desk_id": 2,
    "color": "#F59E0B",
    "avatar": "dados",
    "activity": "Aguardando validação de dataset estatístico..."
  },
  {
    "id": "agente_04",
    "nome": "Agente Diagramador (PDF Studio)",
    "role": "Design & Diagramação",
    "status": "idle",
    "desk_id": 3,
    "color": "#EC4899",
    "avatar": "diagramador",
    "activity": "Tomando cappuccino na máquina italiana..."
  },
  {
    "id": "agente_05",
    "nome": "Agente Publisher (LinkedIn & SEO)",
    "role": "SEO & Redes Sociais",
    "status": "working",
    "desk_id": 4,
    "color": "#8B5CF6",
    "avatar": "publisher",
    "activity": "Formatando metadados de SEO e post de divulgação..."
  }
]
```

---

## 🔌 API REST para Integrações Externas

Você pode integrar a redação com seus scripts de automação ou pipelines reais (ex: ao rodar um script de geração da edição):

### Consultar Agentes
```bash
curl http://localhost:8080/api/agents
```

### Alterar Estado de um Agente
```bash
curl -X POST http://localhost:8080/api/agents/agente_02/status \
  -H "Content-Type: application/json" \
  -d '{"status": "working", "activity": "Escrevendo seção Don'\''t Leave, Just Read..."}'
```

### Disparar Cenários Editoriais Pré-definidos
```bash
# Cenário de Fechamento Total da Edição
curl -X POST http://localhost:8080/api/simulation/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "sprint"}'

# Cenário de Pausa Geral pro Café
curl -X POST http://localhost:8080/api/simulation/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "coffee_break"}'

# Cenário de Submissão para Aprovação do Editor Marlon
curl -X POST http://localhost:8080/api/simulation/scenario \
  -H "Content-Type: application/json" \
  -d '{"scenario": "editor_approval"}'
```
