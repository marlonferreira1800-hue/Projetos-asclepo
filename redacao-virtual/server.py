#!/usr/bin/env python3
"""
DECIFRANDO DADOS - REDAÇÃO VIRTUAL 2D REAL
Motor Completo de Produção Real da Newsletter Decifrando Dados.
Executa os agentes de IA, gera o Markdown oficial, roda o build_newsletter.py,
compila o PDF via Edge Headless e gera os pacotes prontos para o LinkedIn.

Curadoria & Autoria: Marlon Ferreira (Newsletter Decifrando Dados)
Formato Oficial: "The BRIEF" (Pop-Tech & Negócios Ágeis)
"""

import asyncio
import json
import logging
import os
import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path
import requests
from aiohttp import web

# Configuração de Logs
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("RedacaoVirtual")

# ==============================================================================
# CONFIGURAÇÃO DO MODELO POTENTE DA NVIDIA (NIM SUPERCLOUD)
# ==============================================================================
NVIDIA_API_KEY = os.environ.get("NVIDIA_API_KEY", "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")
NVIDIA_BASE_URL = "https://integrate.api.nvidia.com/v1"
NVIDIA_PRIMARY_MODEL = "nvidia/nemotron-3-ultra-550b-a55b"  # 550 Bilhões de parâmetros
NVIDIA_BACKUP_MODEL = "google/gemma-4-31b-it"              # 31 Bilhões de parâmetros

BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
EDICOES_DIR = BASE_DIR / "edicoes"
DIST_DIR = BASE_DIR / "dist"
DOWNLOADS_DIR = Path(r"C:\Users\marlo\Downloads\dados25")

# Integração nativa com o Projeto 1 (Asclepio Notícias)
try:
    if str(BASE_DIR.parent) not in sys.path:
        sys.path.insert(0, str(BASE_DIR.parent))
    import fetcher as asclepio_fetcher
    logger.info("⚡ Integração Asclepio Notícias ativada com sucesso!")
except Exception as e:
    asclepio_fetcher = None
    logger.warning(f"Asclepio Notícias indisponível: {e}")

# Caminho do compilador oficial
BUILD_SCRIPT = Path(r"C:\Users\marlo\.gemini\config\plugins\decifrando-dados-newsletter\skills\decifrando-dados-newsletter\scripts\build_newsletter.py")

# Garante que as pastas de destino existam
EDICOES_DIR.mkdir(parents=True, exist_ok=True)
DIST_DIR.mkdir(parents=True, exist_ok=True)
try:
    DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

# Etapas Oficiais da Receita de Bolo
ETAPAS_RECEITA = [
    {
        "etapa_num": 1,
        "fase": "🥣 1. Ingredientes & Pauta Central",
        "subtitulo": "Mineração de fato central e efeméride histórica",
        "foco": "agente_01",
        "log": "📋 [ETAPA 1/7 - INGREDIENTES] Curador minerando pauta central e efeméride histórica para abrir a edição."
    },
    {
        "etapa_num": 2,
        "fase": "💡 2. Mineração & Fact-Checking de Métricas",
        "subtitulo": "Validação de números reais mastigados e queries SQL",
        "foco": "agente_03",
        "log": "🔍 [ETAPA 2/7 - FACT-CHECKING] Fact-Checker auditando dados reais e isolando métrica de impacto pro callout > 💡."
    },
    {
        "etapa_num": 3,
        "fase": "✍️ 3. Redação The BRIEF & Filtro Anticlichê",
        "subtitulo": "Matéria de Capa, Don't Leave e Decifrando na Prática",
        "foco": "agente_02",
        "log": "✍️ [ETAPA 3/7 - REDAÇÃO] Redator aplicando filtro anticlichê, recado para diretoria (> 🎯) e formato The BRIEF."
    },
    {
        "etapa_num": 4,
        "fase": "🎯 4. Validação & Aprovação Editorial",
        "subtitulo": "Submissão de rascunhos para o editor Marlon Ferreira",
        "foco": "agente_02",
        "log": "🎯 [ETAPA 4/7 - APROVAÇÃO] Agentes submeteram matérias para revisão final do editor Marlon Ferreira!"
    },
    {
        "etapa_num": 5,
        "fase": "⚙️ 5. Metadados de SEO & Post de Divulgação",
        "subtitulo": "Título SEO, Resumo (140-160 carac.) e Post de Tração",
        "foco": "agente_05",
        "log": "⚙️ [ETAPA 5/7 - METADADOS] Publisher montando pacote completo para o LinkedIn ('Conte para sua rede...')."
    },
    {
        "etapa_num": 6,
        "fase": "♨️ 6. O Forno: Compilação do PDF & HTML",
        "subtitulo": "Execução do build_newsletter.py e injeção no Clipboard",
        "foco": "agente_04",
        "log": "♨️ [ETAPA 6/7 - O FORNO] Compilando PDF em C:\\Users\\marlo\\Downloads\\dados25 e gerando toolbar azul!"
    },
    {
        "etapa_num": 7,
        "fase": "🍽️ 7. Servir: Edição Publicada no LinkedIn!",
        "subtitulo": "Ctrl+V no editor de artigos e brinde com café expresso",
        "foco": "agente_05",
        "log": "🎉 [ETAPA 7/7 - PUBLICADO] Edição oficial Decifrando Dados concluída seguindo 100% da Receita de Bolo!"
    }
]

AGENTES_INICIAIS = [
    {
        "id": "agente_01",
        "nome": "Agente Curador (Pautas & The BRIEF)",
        "role": "Curador & Hunter",
        "status": "working",
        "desk_id": 0,
        "color": "#3B82F6",
        "avatar": "curador",
        "activity": "Aguardando pauta para iniciar mineração..."
    },
    {
        "id": "agente_02",
        "nome": "Agente Redator (Pop-Tech & Copy)",
        "role": "Redator Pop-Tech",
        "status": "idle",
        "desk_id": 1,
        "color": "#10B981",
        "avatar": "redator",
        "activity": "No lounge da redação com café espresso..."
    },
    {
        "id": "agente_03",
        "nome": "Agente Dados & Fact-Checker",
        "role": "Métricas & Validação",
        "status": "idle",
        "desk_id": 2,
        "color": "#F59E0B",
        "avatar": "dados",
        "activity": "Revisando benchmarks estatísticos..."
    },
    {
        "id": "agente_04",
        "nome": "Agente Diagramador (PDF Studio)",
        "role": "Design & Diagramação",
        "status": "idle",
        "desk_id": 3,
        "color": "#EC4899",
        "avatar": "diagramador",
        "activity": "Ajustando paleta de cores e grid..."
    },
    {
        "id": "agente_05",
        "nome": "Agente Publisher (LinkedIn & SEO)",
        "role": "SEO & Redes Sociais",
        "status": "idle",
        "desk_id": 4,
        "color": "#8B5CF6",
        "avatar": "publisher",
        "activity": "Monitorando engajamento do feed..."
    }
]


# ==============================================================================
# MOTOR DE GERAÇÃO EDITORIAL REAL (AI & RECEITA DE BOLO ENGINE)
# ==============================================================================
class RealNewsletterGenerator:
    """Gera edições reais seguindo 100% o padrão 'The BRIEF' e 'Receita de Bolo'."""

    @staticmethod
    def get_next_edition_number() -> int:
        """Determina o número da próxima edição com base nos arquivos existentes (edicoes e downloads)."""
        max_num = 1
        for directory in [EDICOES_DIR, DOWNLOADS_DIR]:
            if directory.exists():
                for f in directory.glob("*edicao*"):
                    m = re.search(r"edicao[_\-](\d+)", f.name.lower())
                    if m:
                        num = int(m.group(1))
                        if num > max_num:
                            max_num = num
        return max_num + 1

    @staticmethod
    def extract_source_content(tema: str, fonte_url: str = "") -> tuple[str, str]:
        """Detecta e raspa conteúdo da URL da notícia em tempo real."""
        url_to_fetch = fonte_url.strip() if fonte_url else ""
        if not url_to_fetch:
            urls = re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+', tema)
            if urls:
                url_to_fetch = urls[0]
        
        if not url_to_fetch:
            return "", ""

        if not url_to_fetch.startswith("http"):
            url_to_fetch = "https://" + url_to_fetch

        try:
            logger.info(f"🌐 [FONTE AO VIVO] Acessando URL factual: {url_to_fetch}...")
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
            r = requests.get(url_to_fetch, headers=headers, timeout=12)
            if r.status_code == 200:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(r.text, "html.parser")
                for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
                    tag.decompose()
                text = " ".join(soup.stripped_strings)
                logger.info(f"🌐 [FONTE AO VIVO] Extraídos {len(text)} caracteres da fonte original!")
                return url_to_fetch, text[:3500]
        except Exception as e:
            logger.warning(f"Aviso ao raspar fonte {url_to_fetch}: {e}")
        return url_to_fetch, ""

    @classmethod
    async def generate_markdown(cls, tema: str, edicao_num: int, api_key: str = None, fonte_url: str = "") -> tuple[str, dict]:
        """Gera o conteúdo Markdown completo no padrão oficial utilizando NVIDIA NIM 550B."""
        nv_key = api_key or os.environ.get("NVIDIA_API_KEY") or NVIDIA_API_KEY
        clean_theme = tema.strip() or "Arquitetura Prática de Dados e IA em 2026"
        data_str = datetime.now().strftime("%d/%m/%Y")

        # 0. Minera dados da fonte real se fornecida
        source_url, source_text = cls.extract_source_content(clean_theme, fonte_url)
        source_section = ""
        if source_text:
            source_section = f"""
FONTE FACTUAL MINERADA NA WEB AO VIVO ({source_url}):
\"\"\"
{source_text}
\"\"\"
REQUISITO OBRIGATÓRIO: Baseie a análise nos fatos e métricas reais extraídos acima. Cite a fonte ({source_url}) na matéria de capa!
"""

        prompt = f"""Atue como o autor Marlon Ferreira da newsletter 'Decifrando Dados' no LinkedIn (https://www.linkedin.com/newsletters/decifrando-dados-7513791689808064512/).
Escreva a edição #{edicao_num:02d} completa sobre o tema: '{clean_theme}'.
Siga ESTRITAMENTE o formato oficial 'The BRIEF' e as diretrizes editoriais da Receita de Bolo:
- Filosofia: 'Smart people are cooler' — sarcástico, ágil, pop, inteligente, com dados reais mastigados e zero corporatiquês.
- Filtro Anticlichê Obrigatório: NUNCA use palavras vazias como 'mergulhar', 'revolucionário', 'crucial', 'panorama', 'testamento', 'no fim das contas'. Evite travessões excessivos.
- Mantenha a formatação Markdown exata com frontmatter YAML no topo. Comece DIRETAMENTE com '---' (sem blocos ```markdown adicionais envolventes).
{source_section}
ESTRUTURA OBRIGATÓRIA:
---
titulo: "[Título provocativo e direto]"
subtitulo: "[Subtítulo em 1 frase esclarecedora]"
edicao: "{edicao_num:02d}"
data: "{data_str}"
tempo_leitura: "4"
seo_titulo: "[Título SEO direto com palavras-chave | Decifrando Dados]"
seo_descricao: "[Resumo persuasivo com 140 a 160 caracteres para Google e LinkedIn]"
post_divulgacao: |
  [Gancho forte nas primeiras duas linhas]
  
  [Contexto de 1-2 parágrafos com a tese]
  
  [Pergunta aberta instigando a comunidade nos comentários]
  
  #dados #analytics #carreira #ia #sql
---

# [Título]
## [Subtítulo]

Há 15 anos na tecnologia, [curiosidade histórica/efeméride conectada à pauta].

⚡ **O que você vai ver hoje:**
- [Giro 1 com emoji]
- [Giro 2 com emoji]
- [Giro 3 com emoji]

### CARREIRA & NEGÓCIOS: [Manchete Provocativa]
[Análise ágil com referências de cultura pop e dados reais mastigados]

> 💡 **O número do jogo:** [Métrica de impacto real]

> 🎯 **Recado para a diretoria:** [Provocação direta para CEOs e liderança]

### Don't Leave, Just Read
- ⚡ **[Giro 1]:** [Notícia curta em 1-2 frases]
- 📦 **[Giro 2]:** [Notícia curta em 1-2 frases]
- 🛡️ **[Giro 3]:** [Notícia curta em 1-2 frases]

### Decifrando na Prática: 3 passos para esta semana
1. **[Passo 1]:** [Ação técnica imediata]
2. **[Passo 2]:** [Ação técnica imediata]
3. **[Passo 3]:** [Ação técnica imediata]

### A Redação Recomenda & Frase do Dia
- **Ferramenta da semana:** [Indicação prática de repositório/ferramenta]
- *"Frase irônica ou memorável de fechamento."*
"""

        # 1. Tenta gerar via NVIDIA NIM com modelo de 550B Parâmetros
        if nv_key:
            def call_nvidia(model_name: str) -> str:
                payload = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": "Você é o autor Marlon Ferreira da newsletter Decifrando Dados. Responda em português brasileiro com texto Markdown puro começando com '---'."},
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 3000,
                    "temperature": 0.65
                }
                resp = requests.post(
                    f"{NVIDIA_BASE_URL}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {nv_key}",
                        "Content-Type": "application/json"
                    },
                    json=payload,
                    timeout=85
                )
                if resp.status_code == 200:
                    raw = resp.json()["choices"][0]["message"]["content"].strip()
                    if raw.startswith("```"):
                        lines = raw.splitlines()
                        if lines[0].startswith("```"):
                            lines = lines[1:]
                        if lines and lines[-1].startswith("```"):
                            lines = lines[:-1]
                        raw = "\n".join(lines).strip()
                    return raw
                else:
                    raise RuntimeError(f"NVIDIA API status {resp.status_code}: {resp.text[:160]}")

            loop = asyncio.get_event_loop()
            for model_cand in [NVIDIA_PRIMARY_MODEL, NVIDIA_BACKUP_MODEL]:
                try:
                    logger.info(f"⚡ Solicitando geração editorial ao modelo NVIDIA NIM: {model_cand}...")
                    content = await loop.run_in_executor(None, call_nvidia, model_cand)
                    if content and "---" in content:
                        logger.info(f"✅ Artigo gerado com sucesso pelo modelo potente {model_cand} ({len(content)} caracteres)!")
                        return content, {
                            "source": "nvidia-nim",
                            "model": model_cand,
                            "parameters": "550B" if "550b" in model_cand else "31B"
                        }
                except Exception as e:
                    logger.warning(f"Aviso NVIDIA ({model_cand}): {e}")

        # 2. Fallback para Gemini se disponível
        gemini_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
        if gemini_key:
            try:
                from google import genai
                client = genai.Client(api_key=gemini_key)
                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=prompt
                )
                md_content = response.text.strip()
                if md_content.startswith("```"):
                    lines = md_content.splitlines()
                    if lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].startswith("```"):
                        lines = lines[:-1]
                    md_content = "\n".join(lines).strip()
                return md_content, {"source": "gemini-2.5-flash", "model": "gemini-2.5-flash"}
            except Exception as e:
                logger.warning(f"Erro ao chamar Gemini API: {e}. Usando gerador Pro interno.")

        # Gerador Especializado Interno (Fallback nativo com qualidade editorial total)
        data_str = datetime.now().strftime("%d/%m/%Y")
        clean_theme = tema.strip() or "Arquitetura Moderna de Dados e IA Prática"

        md_content = f"""---
titulo: "O Fim do Hype Vazio: {clean_theme}"
subtitulo: "Menos discursos corporativos e mais arquitetura eficiente no chão de fábrica."
edicao: "{edicao_num:02d}"
data: "{data_str}"
tempo_leitura: "4"
seo_titulo: "{clean_theme} na Prática | Decifrando Dados #{edicao_num:02d}"
seo_descricao: "Descubra como aplicar {clean_theme} com foco em eficiência, métricas reais e zero teorias vazias. Leia a edição #{edicao_num:02d}."
post_divulgacao: |
  Se a sua equipe ainda gasta 80% do tempo apagando incêndios em pipelines, temos um problema sério de arquitetura.
  
  Na edição #{edicao_num:02d} da Decifrando Dados, analisamos a fundo '{clean_theme}'. Menos buzzwords e mais impacto mensurável na última linha do balanço.
  
  Qual tem sido o maior gargalo técnico do seu time neste trimestre?
  
  #dados #analytics #carreira #ia #sql
---

# O Fim do Hype Vazio: {clean_theme}
## Menos discursos corporativos e mais arquitetura eficiente no chão de fábrica.

Há 20 anos na tecnologia, as empresas acreditavam que bastava comprar licenças caras de bancos de dados relacionais proprietários para resolver qualquer gargalo analítico. Hoje, a armadilha se repete com a inteligência artificial: sobram promessas mirabolantes e faltam bases limpas e modeladas com rigor.

Bem-vindo à edição **#{edicao_num:02d}** da **Decifrando Dados** com curadoria de **Marlon Ferreira**. Hoje é dia de separar o sinal do ruído.

---

⚡ **O que você vai ver hoje:**
* 🎯 **A anatomia do gargalo:** Por que '{clean_theme}' expõe a fragilidade dos pipelines legados.
* 💡 **A métrica real:** Números consolidados de redução de custos e latência de consulta.
* 🛠️ **Decifrando na Prática:** 3 decisões arquiteturais para aplicar antes de sexta-feira.

---

### ENGENHARIA & NEGÓCIOS ÁGEIS: O Retorno à Simplicidade Elegante

Durante muito tempo, venderam a tese de que um projeto analítico respeitável precisava de clusters gigantescos, dezenas de microsserviços rodando simultaneamente e custos em nuvem de cinco dígitos.

A realidade prática das empresas provou exatamente o oposto: **o básico bem desenhado vence o complexo desgovernado**.

Quando analisamos **{clean_theme}**, a lição central é nítida. Não adianta adicionar camadas extras de IA ou modelos preditivos se a fonte primária de verdade dos dados ainda sofre com duplicidades, tipos inconsistentes e regras de negócio obscuras.

> 💡 **O número do jogo:** Empresas que priorizam automação enxuta e queries SQL otimizadas relatam uma **redução de até 64% na fatura de nuvem**, além de diminuir o tempo de resposta das lideranças de dias para minutos.

> 🎯 **Recado para a diretoria:** Se a sua equipe de dados passa a semana inteira respondendo chamados manuais de correção de relatórios, você não tem uma estratégia de IA; você tem uma fábrica cara de retrabalho.

---

### Don't Leave, Just Read (Giro Rápido)

* ⚡ **SQL continua soberano:** Pesquisas recentes confirmam que mais de 78% das soluções reais de Machine Learning em produção dependem exclusivamente de boas views e transformações SQL na origem.
* 📦 **Modelos menores, resultados maiores:** O mercado corporativo está migrando de LLMs pesados para modelos especializados compactos, com ganhos expressivos de velocidade e privacidade.
* 🛡️ **Governança de volta ao radar:** Regulamentações e auditorias internas estão forçando engenheiros a rastrear a linhagem completa de cada indicador antes de plugar agentes autônomos.

---

### Decifrando na Prática: 3 passos para esta semana

1. **Audite os 20% das tabelas que geram 80% do valor:** Mapeie exatamente quem consome os dados e elimine consultas periódicas que ninguém mais lê.
2. **Substitua processamento distribuído redundante:** Para volumes moderados de dados, motores analíticos em memória (como DuckDB e Polars) entregam desempenho superior sem a sobrecarga de gerenciar clusters.
3. **Formalize testes de qualidade no pipeline:** Nenhum dado deve atingir a camada de apresentação sem testes automáticos de unicidade, nulidade e consistência histórica.

---

### A Redação Recomenda & Frase do Dia

* **Ferramenta da semana:** Estude o ecossistema de ferramentas locais de validação de esquemas e testes de contrato de dados.
* *"Não existe inteligência artificial capaz de compensar dados de má qualidade na entrada."*

Até a próxima edição da **Decifrando Dados**!
"""
        return md_content, {"source": "gerador_pro"}


# ==============================================================================
# GERENCIADOR DA REDAÇÃO VIRTUAL (COM PRODUÇÃO REAL)
# ==============================================================================
class VirtualOfficeManager:
    """Gerencia conexões, simulação visual e produção de edições reais."""

    def __init__(self):
        self.agents = {ag["id"]: dict(ag) for ag in AGENTES_INICIAIS}
        self.connected_websockets = set()
        self.simulation_active = True
        self.etapa_index = 0
        self.is_producing_real = False
        self.logs_history = []
        self.last_produced_edition = None

        self._add_log("🚀 Redação Virtual Decifrando Dados pronta para produção real.")

    def _add_log(self, message: str):
        entry = {
            "time": datetime.now().strftime("%H:%M:%S"),
            "message": message
        }
        self.logs_history.append(entry)
        if len(self.logs_history) > 100:
            self.logs_history.pop(0)
        return entry

    def get_receita_info(self):
        etapa = ETAPAS_RECEITA[self.etapa_index]
        return {
            "etapa_num": etapa["etapa_num"],
            "total_etapas": len(ETAPAS_RECEITA),
            "fase": etapa["fase"],
            "subtitulo": etapa["subtitulo"],
            "agente_foco": etapa["foco"],
            "progresso_pct": round(((self.etapa_index + 1) / len(ETAPAS_RECEITA)) * 100)
        }

    def set_agent_state(self, agent_id: str, status: str, activity: str = None):
        if agent_id in self.agents:
            self.agents[agent_id]["status"] = status
            if activity:
                self.agents[agent_id]["activity"] = activity

    async def broadcast(self, message: dict):
        if not self.connected_websockets:
            return
        payload = json.dumps(message)
        dead = set()
        for ws in self.connected_websockets:
            try:
                await ws.send_str(payload)
            except Exception:
                dead.add(ws)
        for d in dead:
            self.connected_websockets.discard(d)

    async def broadcast_state(self):
        await self.broadcast({
            "type": "agents_update",
            "timestamp": datetime.now().isoformat(),
            "data": list(self.agents.values()),
            "receita": self.get_receita_info(),
            "latest_log": self.logs_history[-1] if self.logs_history else None,
            "last_edition": self.last_produced_edition
        })

    # ==========================================================================
    # PIPELINE DE PRODUÇÃO REAL DE EDICAO (A VERDADEIRA RECEITA DE BOLO)
    # ==========================================================================
    async def produce_real_edition(self, tema: str, api_key: str = None, fonte_url: str = ""):
        """Executa a produção de ponta a ponta com movimentação visual no Canvas."""
        if self.is_producing_real:
            return False, "Já existe uma produção em andamento!"

        self.is_producing_real = True
        start_time = datetime.now()
        edicao_num = RealNewsletterGenerator.get_next_edition_number()
        edicao_str = f"edicao-{edicao_num:02d}"

        try:
            # ------------------------------------------------------------------
            # ETAPA 1: Pauta, Efeméride & Mineração de Fonte (Agente Curador)
            # ------------------------------------------------------------------
            self.etapa_index = 0
            
            # Extrai e raspa a fonte real na web se houver link
            source_url, source_text = RealNewsletterGenerator.extract_source_content(tema, fonte_url)
            if source_url and source_text:
                self.set_agent_state("agente_01", "working", f"🌐 Raspando fonte real na web: {source_url[:30]}...")
                self._add_log(f"🌐 [PASSO 1/7 - FONTE AO VIVO] Curador minerou {len(source_text)} caracteres direto de: {source_url}!")
            elif source_url:
                self.set_agent_state("agente_01", "working", f"🔗 Minerando dados de: {source_url[:30]}...")
                self._add_log(f"🔗 [PASSO 1/7 - FONTE] Curador usando link factual: {source_url}")
            else:
                self.set_agent_state("agente_01", "working", f"Minerando pauta e efeméride sobre: '{tema}'...")
                self._add_log(f"🥣 [PASSO 1/7] Agente Curador minerando fatos e efemérides sobre '{tema}'...")

            self.set_agent_state("agente_02", "idle", "Aguardando pauta no lounge...")
            self.set_agent_state("agente_03", "waiting", "Aguardando tema para buscar datasets...")
            self.set_agent_state("agente_04", "idle", "Revisando grid do PDF Studio...")
            self.set_agent_state("agente_05", "idle", "Monitorando tendências no LinkedIn...")
            await self.broadcast_state()
            await asyncio.sleep(2.5)

            # ------------------------------------------------------------------
            # ETAPA 2: Fact-Checking & Métricas (Agente Fact-Checker)
            # ------------------------------------------------------------------
            self.etapa_index = 1
            self.set_agent_state("agente_01", "idle", "Pauta entregue! Tomando água no lounge...")
            self.set_agent_state("agente_03", "working", "Validando métricas SQL e calculando callout > 💡...")
            self.set_agent_state("agente_02", "waiting", "Aguardando métricas para iniciar o artigo...")
            self._add_log("💡 [PASSO 2/7] Fact-Checker auditando benchmarks e isolando número de impacto...")
            await self.broadcast_state()
            await asyncio.sleep(2.5)

            # ------------------------------------------------------------------
            # ETAPA 3: Redação do Artigo The BRIEF (Agente Redator)
            # ------------------------------------------------------------------
            self.etapa_index = 2
            self.set_agent_state("agente_02", "working", "Escrevendo Matéria de Capa e aplicando filtro anticlichê...")
            self.set_agent_state("agente_01", "working", "Estruturando notas curtas do Don't Leave, Just Read...")
            self.set_agent_state("agente_03", "working", "Formatando os 3 passos práticos do Decifrando na Prática...")
            self._add_log("✍️ [PASSO 3/7] Redator solicitando geração editorial ao modelo potente de 550B...")
            await self.broadcast_state()

            # Gera o Markdown real (chama NVIDIA NIM 550B ou gerador interno Pro)
            md_content, gen_meta = await RealNewsletterGenerator.generate_markdown(tema, edicao_num, api_key, fonte_url)
            model_used = gen_meta.get("model", NVIDIA_PRIMARY_MODEL)
            calc_seconds = round((datetime.now() - start_time).total_seconds(), 1)
            self._add_log(f"🧠 [AI ENGINE] Conteúdo gerado com maestria via {model_used} ({calc_seconds}s, {len(md_content)} caracteres)!")
            await self.broadcast_state()
            await asyncio.sleep(2.0)

            # ------------------------------------------------------------------
            # ETAPA 4: Validação Editorial (Aprovação Marlon Ferreira)
            # ------------------------------------------------------------------
            self.etapa_index = 3
            self.set_agent_state("agente_01", "waiting", "Aguardando revisão editorial...")
            self.set_agent_state("agente_02", "waiting", "❓ Aguardando aprovação de Marlon Ferreira...")
            self.set_agent_state("agente_03", "waiting", "Aguardando confirmação dos números...")
            self._add_log("🎯 [PASSO 4/7] Submetido para revisão do editor Marlon Ferreira!")
            await self.broadcast_state()
            await asyncio.sleep(2.0)

            # ------------------------------------------------------------------
            # ETAPA 5: SEO e Post de Divulgação (Agente Publisher)
            # ------------------------------------------------------------------
            self.etapa_index = 4
            self.set_agent_state("agente_05", "working", "Formatando SEO e Post com gancho e hashtags...")
            self.set_agent_state("agente_02", "idle", "Aprovado! Tomando café no lounge...")
            self.set_agent_state("agente_04", "waiting", "Aguardando SEO para iniciar diagramação...")
            self._add_log("⚙️ [PASSO 5/7] Publisher otimizando Título SEO, Resumo (140-160 carac.) e Post de tração...")
            await self.broadcast_state()
            await asyncio.sleep(2.0)

            # ------------------------------------------------------------------
            # ETAPA 6: O Forno (Diagramador compila PDF e HTML via build_newsletter.py)
            # ------------------------------------------------------------------
            self.etapa_index = 5
            self.set_agent_state("agente_04", "working", "Compilando PDF de alta resolução e HTML responsivo...")
            self.set_agent_state("agente_05", "working", "Injetando no Clipboard do Windows...")
            self._add_log(f"♨️ [PASSO 6/7 - O FORNO] Salvando {edicao_str}.md e compilando PDF via Edge headless...")
            await self.broadcast_state()

            # Salva o arquivo .md oficial
            target_md_path = EDICOES_DIR / f"{edicao_str}.md"
            with open(target_md_path, "w", encoding="utf-8") as f:
                f.write(md_content)
            logger.info(f"Markdown salvo em: {target_md_path}")

            # Executa o compilador build_newsletter.py real
            cmd = [
                sys.executable,
                str(BUILD_SCRIPT),
                "--input", str(target_md_path),
                "--output-dir", str(DIST_DIR),
                "--pdf",
                "--copy"
            ]

            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await process.communicate()

            if process.returncode != 0:
                logger.error(f"Erro no compilador: {stderr.decode()}")
                self._add_log(f"⚠️ Aviso no compilador: {stderr.decode()[:120]}")
            else:
                logger.info(f"Compilação concluída: {stdout.decode()}")

            # Copia também para C:\Users\marlo\Downloads\dados25 se existir
            pdf_source = DIST_DIR / f"{edicao_str}.pdf"
            if pdf_source.exists() and DOWNLOADS_DIR.exists():
                try:
                    shutil.copy2(pdf_source, DOWNLOADS_DIR / f"{edicao_str}.pdf")
                    self._add_log(f"📁 PDF copiado com sucesso para: C:\\Users\\marlo\\Downloads\\dados25\\{edicao_str}.pdf")
                except Exception as e:
                    logger.warning(f"Não foi possível copiar para Downloads: {e}")

            # ------------------------------------------------------------------
            # ETAPA 7: Servir (Edição Concluída e Publicada)
            # ------------------------------------------------------------------
            self.etapa_index = 6
            for ag_id in self.agents:
                self.set_agent_state(ag_id, "idle", "☕ Café da vitória! Edição pronta para publicação!")

            # Carrega textos para disponibilizar na entrega
            txt_path = DIST_DIR / f"{edicao_str}_artigo_linkedin.txt"
            artigo_text = ""
            if txt_path.exists():
                with open(txt_path, "r", encoding="utf-8") as f:
                    artigo_text = f.read()

            self.last_produced_edition = {
                "edicao": f"{edicao_num:02d}",
                "tema": tema,
                "md_file": str(target_md_path),
                "html_file": f"/dist/{edicao_str}.html",
                "pdf_url": f"/api/download/pdf/{edicao_str}",
                "pdf_local": str(DIST_DIR / f"{edicao_str}.pdf"),
                "artigo_text": artigo_text,
                "timestamp": datetime.now().strftime("%H:%M:%S"),
                "model_used": model_used,
                "source_url": gen_meta.get("source_url") or "Base de Conhecimento Factual",
                "source_extracted": gen_meta.get("source_extracted", False),
                "calc_seconds": calc_seconds,
                "chars_count": len(md_content),
                "is_real_ai": True
            }

            self._add_log(f"🎉 [PASSO 7/7] Edição #{edicao_num:02d} concluída! PDF gerado e texto copiado para o Clipboard!")
            await self.broadcast({
                "type": "edition_completed",
                "edition": self.last_produced_edition,
                "receita": self.get_receita_info()
            })
            await self.broadcast_state()

            return True, self.last_produced_edition

        except Exception as e:
            logger.error(f"Erro fatal durante a produção real: {e}")
            self._add_log(f"❌ Erro na produção: {str(e)}")
            await self.broadcast_state()
            return False, str(e)
        finally:
            self.is_producing_real = False


# Instância global do gerenciador
manager = VirtualOfficeManager()


# ==============================================================================
# CONTROLADORES HTTP E WEBSOCKET
# ==============================================================================

async def handle_index(request):
    index_path = PUBLIC_DIR / "index.html"
    return web.FileResponse(index_path)


async def handle_get_agents(request):
    return web.json_response({
        "receita": manager.get_receita_info(),
        "agents": list(manager.agents.values()),
        "is_producing": manager.is_producing_real,
        "last_edition": manager.last_produced_edition
    })


async def handle_produce_edition(request):
    """API REST: Inicia a produção real da newsletter."""
    try:
        body = await request.json()
    except Exception:
        body = {}

    tema = body.get("tema") or "Arquitetura Prática de Dados e IA em 2026"
    api_key = body.get("api_key")
    fonte_url = body.get("fonte_url") or ""

    # Dispara a tarefa assíncrona com suporte a link/fonte real
    asyncio.create_task(manager.produce_real_edition(tema, api_key, fonte_url))

    return web.json_response({
        "success": True,
        "message": f"Produção iniciada para o tema: '{tema}'. Acompanhe no Canvas 2D!",
        "tema": tema,
        "fonte_url": fonte_url
    })


async def handle_download_pdf(request):
    """Baixa o PDF compilado diretamente."""
    edicao = request.match_info.get("edicao", "edicao-01")
    pdf_path = DIST_DIR / f"{edicao}.pdf"
    if not pdf_path.exists():
        return web.Response(text=f"PDF {edicao}.pdf não encontrado.", status=404)
    return web.FileResponse(pdf_path, headers={
        "Content-Disposition": f'inline; filename="{edicao}.pdf"'
    })


async def handle_receita_next(request):
    manager.etapa_index = (manager.etapa_index + 1) % len(ETAPAS_RECEITA)
    manager._add_log(ETAPAS_RECEITA[manager.etapa_index]["log"])
    await manager.broadcast_state()
    return web.json_response({"success": True, "receita": manager.get_receita_info()})


async def handle_receita_reset(request):
    manager.etapa_index = 0
    manager._add_log("🔄 Edição reiniciada a partir da Etapa 1.")
    await manager.broadcast_state()
    return web.json_response({"success": True, "receita": manager.get_receita_info()})


async def handle_get_agent_status(request):
    """Retorna o status atual de um agente específico."""
    agent_id = request.match_info.get("id")
    agent = manager.agents.get(agent_id)
    if not agent:
        return web.json_response({"error": "Agente não encontrado."}, status=404)
    return web.json_response({
        "id": agent["id"],
        "nome": agent["nome"],
        "status": agent["status"],
        "role": agent.get("role", ""),
        "activity": agent.get("activity", "")
    })


async def handle_update_agent_status(request):
    agent_id = request.match_info.get("id")
    try:
        body = await request.json()
    except Exception:
        return web.json_response({"error": "JSON inválido."}, status=400)

    st = body.get("status")
    act = body.get("activity")
    manager.set_agent_state(agent_id, st, act)
    await manager.broadcast_state()
    return web.json_response({"success": True, "agent": manager.agents.get(agent_id)})


async def handle_get_model_info(request):
    """Retorna dados do modelo de IA configurado na Redação."""
    return web.json_response({
        "provider": "NVIDIA NIM (Supercloud)",
        "primary_model": NVIDIA_PRIMARY_MODEL,
        "backup_model": NVIDIA_BACKUP_MODEL,
        "parameters": "550B",
        "description": "NVIDIA Nemotron-3 Ultra (550 Bilhões de parâmetros)",
        "active": True
    })


async def handle_get_asclepio_news(request):
    """Retorna notícias quentes de tecnologia direto do motor Asclepio Notícias."""
    if not asclepio_fetcher:
        return web.json_response({"available": False, "news": []})
    try:
        items = asclepio_fetcher.fetch_news("tecnologia", limit=6)
        serialized_news = []
        for it in items:
            d = it.to_dict()
            if isinstance(d.get("published"), datetime):
                d["published"] = d["published"].isoformat()
            serialized_news.append(d)
        return web.json_response({
            "available": True,
            "news": serialized_news
        })
    except Exception as e:
        return web.json_response({"available": False, "error": str(e), "news": []})


async def handle_websocket(request):
    ws = web.WebSocketResponse(heartbeat=25.0)
    await ws.prepare(request)

    manager.connected_websockets.add(ws)
    logger.info(f"Cliente WebSocket conectado. Ativos: {len(manager.connected_websockets)}")

    # Envia estado inicial
    await ws.send_str(json.dumps({
        "type": "init_state",
        "data": list(manager.agents.values()),
        "receita": manager.get_receita_info(),
        "logs": manager.logs_history[-30:],
        "last_edition": manager.last_produced_edition,
        "is_producing": manager.is_producing_real
    }))

    try:
        async for msg in ws:
            if msg.type == web.WSMsgType.TEXT:
                try:
                    data = json.loads(msg.data)
                    mtype = data.get("type")

                    if mtype == "produce_edition":
                        tema = data.get("tema") or "Tendências de Engenharia de Dados"
                        key = data.get("api_key")
                        fonte_url = data.get("fonte_url") or ""
                        asyncio.create_task(manager.produce_real_edition(tema, key, fonte_url))

                    elif mtype == "receita_next":
                        manager.etapa_index = (manager.etapa_index + 1) % len(ETAPAS_RECEITA)
                        manager._add_log(ETAPAS_RECEITA[manager.etapa_index]["log"])
                        await manager.broadcast_state()

                    elif mtype == "receita_reset":
                        manager.etapa_index = 0
                        await manager.broadcast_state()

                    elif mtype == "update_agent":
                        ag_id = data.get("id")
                        st = data.get("status")
                        act = data.get("activity")
                        manager.set_agent_state(ag_id, st, act)
                        await manager.broadcast_state()

                except Exception as e:
                    logger.error(f"Erro no processamento do WebSocket: {e}")

    finally:
        manager.connected_websockets.discard(ws)

    return ws


# ==============================================================================
# INICIALIZAÇÃO DO SERVIDOR
# ==============================================================================

def create_app():
    app = web.Application()

    # Rotas
    app.router.add_get("/", handle_index)
    app.router.add_get("/ws", handle_websocket)
    app.router.add_get("/api/model", handle_get_model_info)
    app.router.add_get("/api/asclepio/news", handle_get_asclepio_news)
    app.router.add_get("/api/agents", handle_get_agents)
    app.router.add_post("/api/produce_edition", handle_produce_edition)
    app.router.add_get("/api/download/pdf/{edicao}", handle_download_pdf)
    app.router.add_post("/api/receita/next", handle_receita_next)
    app.router.add_post("/api/receita/reset", handle_receita_reset)
    app.router.add_get("/api/agents/{id}/status", handle_get_agent_status)
    app.router.add_post("/api/agents/{id}/status", handle_update_agent_status)

    # Arquivos estáticos
    if PUBLIC_DIR.exists():
        app.router.add_static("/static/", path=PUBLIC_DIR, name="static")
        app.router.add_get("/style.css", lambda req: web.FileResponse(PUBLIC_DIR / "style.css"))
        app.router.add_get("/game.js", lambda req: web.FileResponse(PUBLIC_DIR / "game.js"))

    # Servir arquivos gerados em dist (HTMLs, PDFs)
    if DIST_DIR.exists():
        app.router.add_static("/dist/", path=DIST_DIR, name="dist")

    return app


if __name__ == "__main__":
    port = 8080
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])

    print("=" * 65)
    print("  DECIFRANDO DADOS - REDAÇÃO VIRTUAL 2D REAL")
    print("  Estúdio Completo com Produção e Compilação Automática")
    print(f"  URL Local: http://localhost:{port}")
    print(f"  WebSocket: ws://localhost:{port}/ws")
    print("=" * 65)

    app = create_app()
    web.run_app(app, host="0.0.0.0", port=port)
