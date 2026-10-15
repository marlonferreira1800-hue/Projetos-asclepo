# 📚 Agente Tradutor Editorial de Livros (Gemini API)

Agente autônomo projetado para contornar os limites de saída (*output tokens*) dos modelos de linguagem, traduzindo livros e documentos longos (300+ páginas) do inglês para o Português do Brasil com **qualidade editorial**, **consistência terminológica** e **tolerância a falhas**.

---

## 🏗️ As 4 Fases da Arquitetura

1. **Fase 1: Extração e Chunking Semântico**
   - **EPUB (.epub):** Mantém 100% da formatação interna HTML, imagens, índices e folhas de estilo CSS originais.
   - **PDF (.pdf):** Converte o PDF para Markdown estruturado (via `pymupdf4llm`), eliminando quebras falsas de página, cabeçalhos repetidos e notas de rodapé perdidas.
   - **Markdown/TXT:** Divide em blocos semânticos respeitando parágrafos (`\n\n`) e títulos (`#`, `##`), sem cortar frases.

2. **Fase 2: Geração Automática de Glossário & Guia de Estilo**
   - O agente analisa uma amostra ampla do início da obra e gera `glossario_<livro>.json`.
   - Identifica o tom (acadêmico, didático, ficcional), tratamento pronominal e tradução padronizada de jargões técnicos e nomes próprios.
   - O arquivo pode ser editado pelo usuário antes ou durante o processo.

3. **Fase 3: Loop de Tradução com Janela Deslizante & Checkpoint**
   - Mantém um resumo do trecho anterior traduzido (~1.000 caracteres) para garantir continuidade e concordância.
   - Salva cada bloco traduzido instantaneamente em `checkpoint_<livro>.json`.
   - Se a internet oscilar ou o processo for cancelado, a reexecução retoma exatamente do bloco onde parou.
   - Mecanismo embutido de **Backoff Exponencial** contra limites de requisições por minuto (Rate Limits 429).

4. **Fase 4: Remontagem Editorial**
   - **EPUB:** Gera o arquivo final `<livro>_PTBR.epub` pronto para Kindle, Apple Books e leitores digitais.
   - **PDF / Markdown:** Gera `<livro>_PTBR.md` e um arquivo `<livro>_PTBR.html` responsivo diagramado para leitura e com botão para impressão direta em PDF via navegador.

---

## 🚀 Como Usar

### 1. Configurar sua Chave da API Gemini
Crie um arquivo `.env` nesta pasta (ou copie de `.env.example`):
```env
GEMINI_API_KEY=sua_chave_aqui
GEMINI_MODEL=gemini-2.5-flash
```

### 2. Executar

**Modo Interativo (Arrastar e Soltar):**
Dê um duplo clique em `INICIAR_TRADUTOR.bat` ou execute:
```bash
python agente_tradutor.py
```

**Modo Linha de Comando (CLI):**
```bash
# Traduzir um livro em EPUB
python agente_tradutor.py --livro "caminho/meu_livro.epub"

# Traduzir um livro em PDF
python agente_tradutor.py --livro "caminho/manual_tecnico.pdf"

# Usar Gemini 2.5 Pro para maior refinamento literário
python agente_tradutor.py --livro "meu_livro.epub" --modelo gemini-2.5-pro

# Forçar a recriação do glossário
python agente_tradutor.py --livro "meu_livro.epub" --recriar-glossario
```

---

## 📦 Dependências Instaladas

- `google-genai` (SDK oficial do Gemini)
- `ebooklib` + `beautifulsoup4` (Manipulação e remontagem de EPUBs)
- `pymupdf` + `pymupdf4llm` (Conversão inteligente de PDFs para Markdown)
- `python-dotenv` (Gestão de chaves de ambiente)
- `rich` (Barra de progresso e painel visual no terminal)
