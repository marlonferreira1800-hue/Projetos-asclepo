# ⚡ ASCLEPIO NOTÍCIAS | Radar Global em Tempo Real (Web & Terminal)

O **Asclepio Notícias** é um agregador e buscador de notícias em tempo real, bilíngue (**Português e Inglês**), com suporte a **Busca Mundial 360° com Tradução Automática**, cobertura do Brasil e do mundo todo, sem necessidade de chaves de API pagas.

O projeto oferece duas interfaces:
1. 🌐 **Interface Web Moderna (Navegador):** Dashboard responsivo com cards, modais, busca e auto-refresh em tempo real.
2. 💻 **Interface CLI (Terminal):** Modo interativo estilizado via Rich, atalhos rápidos e monitor de breaking news.

---

## 🚀 Como Executar

### 1. 🌐 Versão Web (Recomendado)
Para abrir no navegador padrão com interface gráfica:

```powershell
python app.py
```
*Ou dê 2 cliques no atalho:*
`Iniciar_Asclepio_Noticias.bat`

Acesse no seu navegador: **`http://localhost:5050`**

---

### 2. 💻 Versão Terminal (CLI)
Para executar diretamente no terminal:

```powershell
python news.py
```
*Ou dê 2 cliques no atalho:*
`noticias.bat`

#### Comandos Rápidos no Terminal:
```powershell
# Busca Mundial 360° (Mundo Todo: PT & EN com tradução simultânea)
python news.py --mundial "acordo nuclear"
python news.py --mundial "petróleo"
python news.py --mundial "inteligência artificial"

# Notícias por Categoria
python news.py --brasil          # Destaques do Brasil
python news.py --mundo           # Internacional em Português
python news.py --world-en        # Top Stories Globais em Inglês
python news.py --tech-en         # Tecnologia & IA Global
python news.py --theverge        # The Verge direto
python news.py --techcrunch      # TechCrunch direto
python news.py --economia        # Economia e Finanças BR
python news.py --business-en     # Wall Street & Mercados Globais

# Monitor Ao Vivo (Breaking News Watcher)
python news.py --monitor brasil --intervalo 30
```

---

## 🌍 Funcionalidade Exclusiva: Busca Mundial 360°

- Digite qualquer notícia ou assunto específico (ex: `petróleo`, `OpenAI`, `crise energética`, `eleições`, `Taiwan`).
- O sistema traduz automaticamente entre Português e Inglês (ex: `petróleo` ⇄ `oil`).
- Varre os maiores veículos do Brasil *(G1, Folha, Estadão, CNN Brasil, InfoMoney, Poder360)* **E** do Mundo Todo *(Reuters, BBC, Wall Street Journal, The Guardian, CNBC, Bloomberg, NYT)* simultaneamente.
- Consolida e ordena tudo por publicação mais recente com tags `🇧🇷 PT` e `🌐 EN`.

---

## 📦 Instalação

```bash
git clone https://github.com/marlonferreira1800-hue/Projetos-asclepo.git
cd Projetos-asclepo
pip install -r requirements.txt
```

---

## 🛠️ Tecnologias Utilizadas
- **Python 3**
- **Flask** (Servidor Web REST API)
- **Tailwind CSS & Lucide Icons** (Interface Web)
- **Rich** (Terminal UI & Tabelas)
- **Feedparser & Requests** (Coleta e Normalização RSS)
