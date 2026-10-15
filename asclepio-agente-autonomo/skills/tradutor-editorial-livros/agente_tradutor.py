#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
================================================================================
🤖 AGENTE TRADUTOR EDITORIAL DE LIVROS & DOCUMENTOS LONGOS (GEMINI API)
================================================================================
Arquitetura em 4 fases:
  1. Chunking Semântico & Sub-lotes HTML (EPUB, PDF, Markdown, TXT)
  2. Geração Automática de Glossário & Guia de Estilo Editorial
  3. Loop com Janela Deslizante, Resiliência e Checkpoint Contínuo
  4. Remontagem Fiel de Layout e Exportação (EPUB / Markdown / HTML / PDF)
================================================================================
"""

import os
import sys
import json
import time
import hashlib
import argparse
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

# Força codificação UTF-8 no terminal Windows para suporte total a emojis e acentos
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Carregamento de variáveis de ambiente (.env)
from dotenv import load_dotenv
load_dotenv()

# Google GenAI SDK Oficial
try:
    from google import genai
    from google.genai import types
except ImportError:
    print("❌ Erro: O pacote 'google-genai' não está instalado.")
    print("Instale com: pip install google-genai")
    sys.exit(1)

# Interface Visual no Terminal
try:
    from rich.console import Console
    from rich.panel import Panel
    from rich.table import Table
    from rich.progress import Progress, SpinnerColumn, BarColumn, TextColumn, TimeElapsedColumn, TimeRemainingColumn
    console = Console(force_terminal=True, legacy_windows=False)
except Exception:
    class FallbackConsole:
        def print(self, *args, **kwargs):
            try:
                print(*args)
            except Exception:
                pass
    console = FallbackConsole()



# ==============================================================================
# CONFIGURAÇÕES PADRÃO & MODELOS
# ==============================================================================
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")
DEFAULT_MAX_CHARS = 9000        # ~1.800 palavras por lote (ideal para resposta perfeita sem cortes)
CONTEXT_WINDOW_CHARS = 1000     # Janela deslizante de continuidade


# ==============================================================================
# FASE 1: EXTRATORES E CHUNKING HIERÁRQUICO
# ==============================================================================

def dividir_texto_em_blocos(texto: str, max_chars: int = DEFAULT_MAX_CHARS) -> List[str]:
    """
    Divide um texto longo em blocos semânticos, respeitando parágrafos e cabeçalhos.
    Nunca quebra frases ao meio.
    """
    paragrafos = texto.split("\n\n")
    blocos = []
    bloco_atual = []
    tamanho_atual = 0

    for p in paragrafos:
        p_strip = p.strip()
        if not p_strip:
            continue
        
        if len(p_strip) > max_chars:
            linhas = p_strip.split("\n")
            for linha in linhas:
                if tamanho_atual + len(linha) > max_chars and bloco_atual:
                    blocos.append("\n\n".join(bloco_atual).strip())
                    bloco_atual = []
                    tamanho_atual = 0
                bloco_atual.append(linha)
                tamanho_atual += len(linha)
            continue

        if tamanho_atual + len(p_strip) > max_chars and bloco_atual:
            blocos.append("\n\n".join(bloco_atual).strip())
            bloco_atual = []
            tamanho_atual = 0

        bloco_atual.append(p_strip)
        tamanho_atual += len(p_strip) + 2

    if bloco_atual:
        blocos.append("\n\n".join(bloco_atual).strip())

    return blocos


class ExtratorEPUB:
    """Gerencia leitura, sub-loteamento e remontagem de arquivos .epub mantendo imagens e formatação."""
    
    @staticmethod
    def carregar_livro(caminho_epub: str):
        try:
            import ebooklib
            from ebooklib import epub
            return epub.read_epub(caminho_epub)
        except ImportError:
            raise ImportError("Para traduzir arquivos .epub, instale: pip install ebooklib beautifulsoup4")

    @staticmethod
    def extrair_unidades_traducao(livro, max_chars: int = DEFAULT_MAX_CHARS) -> Tuple[List[Dict[str, Any]], str]:
        """
        Extrai capítulos e sub-divide capítulos longos em lotes de elementos HTML (<section>, <p>, <h1>, etc.).
        Retorna a lista de tarefas de tradução e uma amostra de texto para o glossário.
        """
        import ebooklib
        from bs4 import BeautifulSoup

        docs = [item for item in livro.get_items() if item.get_type() == ebooklib.ITEM_DOCUMENT]
        tarefas_traducao = []
        amostra_textos = []

        for doc in docs:
            conteudo_raw = doc.get_content()
            try:
                conteudo_html = conteudo_raw.decode("utf-8")
            except UnicodeDecodeError:
                conteudo_html = conteudo_raw.decode("latin-1", errors="replace")

            soup = BeautifulSoup(conteudo_html, "html.parser")
            texto_puro = soup.get_text().strip()

            # Pula páginas vazias ou meros placeholders de capa sem texto
            if len(texto_puro) < 20:
                continue

            if len(amostra_textos) < 4:
                amostra_textos.append(texto_puro[:10000])

            # Localiza o contêiner principal do capítulo (section, body ou div principal)
            container = soup.find("section") or soup.find("body") or soup
            children = [c for c in container.children if getattr(c, "name", None)]

            if not children or len(conteudo_html) <= max_chars:
                # Documento pequeno: traduz o HTML inteiro de uma vez
                tarefas_traducao.append({
                    "id": f"{doc.get_id()}__full",
                    "doc_id": doc.get_id(),
                    "tipo": "full_doc",
                    "html": conteudo_html,
                    "chars": len(conteudo_html),
                    "titulo": doc.get_name()
                })
            else:
                # Documento longo (ex: capítulo com 30k+ chars): agrupa elementos filhos em sub-lotes seguros
                lotes_elementos = []
                lote_atual = []
                tamanho_atual = 0

                for c in children:
                    s = str(c)
                    if tamanho_atual + len(s) > max_chars and lote_atual:
                        lotes_elementos.append(lote_atual)
                        lote_atual = [c]
                        tamanho_atual = len(s)
                    else:
                        lote_atual.append(c)
                        tamanho_atual += len(s)
                if lote_atual:
                    lotes_elementos.append(lote_atual)

                for idx, lote in enumerate(lotes_elementos):
                    fragmento_html = "".join(str(elem) for elem in lote)
                    tarefas_traducao.append({
                        "id": f"{doc.get_id()}__b{idx}",
                        "doc_id": doc.get_id(),
                        "sub_idx": idx,
                        "total_subs": len(lotes_elementos),
                        "tipo": "sub_batch",
                        "html": fragmento_html,
                        "chars": len(fragmento_html),
                        "titulo": f"{doc.get_name()} (Lote {idx+1}/{len(lotes_elementos)})"
                    })

        amostra_final = "\n\n".join(amostra_textos)
        return tarefas_traducao, amostra_final

    @staticmethod
    def reconstruir_e_salvar_epub(livro, mapa_traducoes: Dict[str, str], caminho_saida: str, max_chars: int = DEFAULT_MAX_CHARS):
        """Aplica os fragmentos e documentos traduzidos de volta nos itens do EPUB e grava o arquivo final."""
        import ebooklib
        from ebooklib import epub
        from bs4 import BeautifulSoup

        for item in livro.get_items():
            if item.get_type() != ebooklib.ITEM_DOCUMENT:
                continue

            doc_id = item.get_id()
            full_key = f"{doc_id}__full"

            if full_key in mapa_traducoes:
                # Documento traduzido integralmente
                item.set_content(mapa_traducoes[full_key].encode("utf-8"))
                continue

            # Se foi dividido em sub-lotes
            chaves_sub = [k for k in mapa_traducoes if k.startswith(f"{doc_id}__b")]
            if not chaves_sub:
                continue

            # Reconstitui o documento substituindo os lotes originais
            conteudo_raw = item.get_content().decode("utf-8", errors="replace")
            soup = BeautifulSoup(conteudo_raw, "html.parser")
            container = soup.find("section") or soup.find("body") or soup
            children = [c for c in container.children if getattr(c, "name", None)]

            # Reagrupa os mesmos lotes para substituição direta no DOM
            lotes_elementos = []
            lote_atual = []
            tamanho_atual = 0
            for c in children:
                s = str(c)
                if tamanho_atual + len(s) > max_chars and lote_atual:
                    lotes_elementos.append(lote_atual)
                    lote_atual = [c]
                    tamanho_atual = len(s)
                else:
                    lote_atual.append(c)
                    tamanho_atual += len(s)
            if lote_atual:
                lotes_elementos.append(lote_atual)

            # Aplica cada lote traduzido
            for idx, lote in enumerate(lotes_elementos):
                chave = f"{doc_id}__b{idx}"
                if chave in mapa_traducoes:
                    trans_html = mapa_traducoes[chave]
                    trans_fragment = BeautifulSoup(trans_html, "html.parser")
                    first_elem = lote[0]
                    for child in list(trans_fragment.children):
                        first_elem.insert_before(child)
                    for elem in lote:
                        elem.decompose()

            item.set_content(str(soup).encode("utf-8"))

        # Corrige itens do TOC sem uid (previne erro TypeError no ebooklib/lxml)
        def fix_toc_uids(toc, counter=0):
            for t_item in toc:
                if isinstance(t_item, (list, tuple)):
                    sec, children = t_item
                    if getattr(sec, 'uid', None) is None:
                        sec.uid = f"navpoint_{counter}"
                        counter += 1
                    counter = fix_toc_uids(children, counter)
                else:
                    if getattr(t_item, 'uid', None) is None:
                        t_item.uid = f"navpoint_{counter}"
                        counter += 1
            return counter

        try:
            fix_toc_uids(livro.toc)
        except Exception:
            pass

        epub.write_epub(caminho_saida, livro)


class ExtratorPDF:
    """Converte PDF para Markdown estruturado de alta fidelidade."""
    
    @staticmethod
    def extrair_markdown(caminho_pdf: str) -> str:
        try:
            import pymupdf4llm
            return pymupdf4llm.to_markdown(caminho_pdf)
        except ImportError:
            try:
                import fitz
                doc = fitz.open(caminho_pdf)
                return "\n\n".join(pagina.get_text("text") for pagina in doc)
            except ImportError:
                raise ImportError("Para traduzir arquivos .pdf, instale: pip install pymupdf pymupdf4llm")


# ==============================================================================
# FASE 2: GERAÇÃO DE GLOSSÁRIO & GUIA DE ESTILO EDITORIAL
# ==============================================================================

def gerar_ou_carregar_glossario(
    client: genai.Client,
    texto_amostra: str,
    caminho_glossario: Path,
    modelo: str = DEFAULT_MODEL,
    forcar_recriar: bool = False
) -> Dict[str, Any]:
    """
    Analisa os primeiros trechos da obra e cria um glossário técnico e guia de estilo.
    Salva em disco para permitir auditoria ou edição manual pelo usuário.
    """
    if caminho_glossario.exists() and not forcar_recriar:
        try:
            with open(caminho_glossario, "r", encoding="utf-8") as f:
                dados = json.load(f)
                console.print(f"[green]✓ Glossário carregado com sucesso de:[/green] {caminho_glossario.name}")
                return dados
        except Exception as e:
            console.print(f"[yellow]Aviso: Falha ao ler glossário existente ({e}). Criando um novo...[/yellow]")

    console.print("[cyan]⏳ Gerando Guia de Estilo e Glossário Editorial com Gemini...[/cyan]")
    
    amostra = texto_amostra[:35000]
    
    prompt = f"""
    Você é um editor sênior e tradutor literário/médico/técnico bilíngue (Inglês para Português do Brasil).
    Analise a amostra deste livro e extraia diretrizes rigorosas para que toda a tradução mantenha consistência terminológica e tom editorial unificado:

    Responda EXCLUSIVAMENTE em formato JSON com as seguintes chaves:
    {{
      "tom_da_obra": "Descrição precisa do tom (ex: visionário, médico, científico rigoroso porém humanizado e acessível ao leitor geral)",
      "pessoa_e_tratamento": "Diretriz sobre pronomes e tratamento (ex: 'você' natural e fluido, mantendo a voz do autor em primeira pessoa)",
      "regras_especificas": [
        "Preservar siglas consagradas como AI, EHR, ECG com sua respectiva explicação na primeira ocorrência",
        "Termos como 'Machine Learning' e 'Deep Learning' podem ser traduzidos ou mantidos de forma elegante e consagrada no meio",
        "Tradução precisa de especialidades médicas (Cardiology, Radiology, Pathology)"
      ],
      "glossario_termos": {{
        "Deep Medicine": "Deep Medicine (Medicina Profunda)",
        "Machine Learning": "Aprendizado de Máquina (Machine Learning)",
        "Deep Learning": "Aprendizado Profundo (Deep Learning)",
        "Electronic Health Record": "Prontuário Eletrônico do Paciente (PEP / EHR)",
        "Clinical Trial": "Ensaio Clínico",
        "Physician": "Médico",
        "Burnout": "Burnout (esgotamento profissional)"
      }}
    }}

    Amostra do livro:
    ---
    {amostra}
    ---
    """

    for tentativa in range(1, 4):
        try:
            response = client.models.generate_content(
                model=modelo,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )
            glossario_data = json.loads(response.text)
            
            with open(caminho_glossario, "w", encoding="utf-8") as f:
                json.dump(glossario_data, f, ensure_ascii=False, indent=2)
                
            console.print(f"[green]✓ Novo glossário criado e salvo em:[/green] {caminho_glossario.name}")
            return glossario_data
        except Exception as e:
            time.sleep(2 * tentativa)
            if tentativa == 3:
                console.print(f"[yellow]Aviso: Falha ao gerar glossário automático ({e}). Usando perfil padrão.[/yellow]")
                return {
                    "tom_da_obra": "Visionário, médico, acessível e empático",
                    "pessoa_e_tratamento": "Tratamento natural em 'você', preservando a voz do autor em 1ª pessoa",
                    "regras_especificas": ["Preservar termos técnicos consagrados", "Manter fidelidade integral ao texto"],
                    "glossario_termos": {
                        "Deep Medicine": "Deep Medicine (Medicina Profunda)",
                        "Machine Learning": "Aprendizado de Máquina",
                        "Deep Learning": "Aprendizado Profundo"
                    }
                }


# ==============================================================================
# FASE 3: AGENTE TRADUTOR COM JANELA DESLIZANTE & CHECKPOINT
# ==============================================================================

MODEL_POOL = [
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-2.5-flash"
]

def traduzir_bloco_com_resiliencia(
    client: genai.Client,
    bloco_ingles: str,
    glossario: Dict[str, Any],
    contexto_anterior: str,
    eh_html: bool = False,
    modelo: Optional[str] = None,
    max_retries: int = 8
) -> str:
    """
    Traduz um bloco textual com janela deslizante, retry automático e
    POOL DE ROTAÇÃO MULTI-MODELO (Gemini 3.7 -> 3.6 -> 3.5 -> Lite) para garantir
    que a tradução nunca pare por limite de cota individual de modelo.
    """
    glossario_str = json.dumps(glossario, ensure_ascii=False, indent=2)

    if eh_html:
        diretriz_formato = """
        - REQUISITO CRÍTICO DE HTML: PRESERVE ESTRITAMENTE todas as tags HTML, classes, atributos (ex: <p class="...">, <h1>, <div>, <span>, <a>, <img>, id).
        - Traduza APENAS o conteúdo de texto visível dentro das tags.
        - NUNCA omita ou remova tags <img> ou links <a href="...">.
        - Retorne o HTML limpo diretamente, sem cercar com blocos ```html ou markdown.
        """
    else:
        diretriz_formato = """
        - Preserve 100% da formatação original em Markdown (títulos #, negritos **, itálicos *, listas, tabelas, blocos de código).
        """

    system_instruction = f"""
    Você é um Tradutor Editorial Especialista de altíssimo nível, vertendo do Inglês para o Português do Brasil (PT-BR).

    REGRAS INEGOCIÁVEIS:
    1. TRADUÇÃO INTEGRAL E COMPLETA: NUNCA resuma, sintetize, pule parágrafos ou corte exemplos. Cada frase deve ser traduzida com total fidelidade semântica e elegância estilística.
    2. CONTINUIDADE: Use o contexto final do trecho anterior para garantir perfeita concordância gramatical, pronominal e fluidez entre capítulos/seções.
    3. GUIA EDITORIAL & GLOSSÁRIO: Siga rigorosamente este guia da obra:
    {glossario_str}
    {diretriz_formato}
    """

    contexto_ref = contexto_anterior[-CONTEXT_WINDOW_CHARS:] if contexto_anterior else "Início da obra."

    prompt = f"""
    [CONTEXTO RECENTE JÁ TRADUZIDO (Apenas para continuidade - NÃO retraduza este trecho)]:
    {contexto_ref}

    ---
    [TRECHO ATUAL EM INGLÊS PARA TRADUÇÃO COMPLETA]:
    {bloco_ingles}
    """

    # Monta a lista de modelos ordenados
    pool = [modelo] if modelo and modelo in MODEL_POOL else []
    for m in MODEL_POOL:
        if m not in pool:
            pool.append(m)

    atraso_espera = 2
    for tentativa in range(1, max_retries + 1):
        modelo_atual = pool[(tentativa - 1) % len(pool)]
        try:
            response = client.models.generate_content(
                model=modelo_atual,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    temperature=0.3,
                )
            )
            texto_traduzido = response.text
            if texto_traduzido:
                t = texto_traduzido.strip()
                if t.startswith("```html") and t.endswith("```"):
                    t = t[7:-3].strip()
                elif t.startswith("```") and t.endswith("```"):
                    t = t[3:-3].strip()
                return t
            raise ValueError("Resposta vazia retornada pela API.")
        except Exception as e:
            if tentativa == max_retries:
                console.print(f"[red]Erro crítico no bloco após {max_retries} tentativas: {e}[/red]")
                raise e
            proximo_modelo = pool[tentativa % len(pool)]
            console.print(f"[yellow]⚠️ {modelo_atual} alternado ({str(e)[:70]}...). Tentando {proximo_modelo} em {atraso_espera}s...[/yellow]")
            time.sleep(atraso_espera)
            atraso_espera = min(20, atraso_espera * 1.5)

    return ""


class GerenciadorCheckpoint:
    """Garante que nenhum progresso seja perdido caso haja interrupção."""
    
    def __init__(self, caminho_checkpoint: Path, total_blocos: int, metadata: Dict[str, Any]):
        self.caminho = caminho_checkpoint
        self.dados = {
            "metadata": metadata,
            "total_blocos": total_blocos,
            "blocos_traduzidos": {},
            "timestamp_inicio": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        self.carregar_existente()

    def carregar_existente(self):
        if self.caminho.exists():
            try:
                with open(self.caminho, "r", encoding="utf-8") as f:
                    conteudo = json.load(f)
                    # Compatibilidade com formatos de lista ou dicionário
                    if isinstance(conteudo.get("blocos_traduzidos"), list):
                        mapa = {item["id"] if "id" in item else str(item["indice"]): item["traducao"] for item in conteudo["blocos_traduzidos"]}
                        conteudo["blocos_traduzidos"] = mapa
                    self.dados = conteudo
                    n_concluidos = len(self.dados.get("blocos_traduzidos", {}))
                    console.print(f"[cyan]🔄 Checkpoint recuperado: {n_concluidos}/{self.dados.get('total_blocos', '?')} blocos já prontos.[/cyan]")
            except Exception as e:
                console.print(f"[yellow]Aviso ao carregar checkpoint: {e}. Iniciando do zero.[/yellow]")

    def salvar_bloco(self, chave_id: str, texto_traduzido: str):
        if "blocos_traduzidos" not in self.dados:
            self.dados["blocos_traduzidos"] = {}
        self.dados["blocos_traduzidos"][chave_id] = texto_traduzido
        self.dados["timestamp_ultima_atualizacao"] = time.strftime("%Y-%m-%d %H:%M:%S")
        
        temp_file = self.caminho.with_suffix(".tmp")
        with open(temp_file, "w", encoding="utf-8") as f:
            json.dump(self.dados, f, ensure_ascii=False, indent=2)
        temp_file.replace(self.caminho)

    def obter_bloco_traduzido(self, chave_id: str) -> Optional[str]:
        return self.dados.get("blocos_traduzidos", {}).get(chave_id)

    def obter_mapa_completo(self) -> Dict[str, str]:
        return self.dados.get("blocos_traduzidos", {})


# ==============================================================================
# FASE 4: ORQUESTRADOR PRINCIPAL & EXPORTAÇÃO
# ==============================================================================

def exportar_html_diagramado(titulo: str, conteudo_markdown: str, caminho_saida_html: Path):
    """Gera um arquivo HTML com tipografia moderna de livro pronta para leitura ou impressão em PDF."""
    import re
    linhas = conteudo_markdown.split("\n")
    html_body = []
    
    em_paragrafo = False
    for linha in linhas:
        l = linha.strip()
        if not l:
            if em_paragrafo:
                html_body.append("</p>")
                em_paragrafo = False
            continue

        if l.startswith("# "):
            if em_paragrafo: html_body.append("</p>"); em_paragrafo = False
            html_body.append(f"<h1 class='capitulo-titulo'>{l[2:]}</h1>")
        elif l.startswith("## "):
            if em_paragrafo: html_body.append("</p>"); em_paragrafo = False
            html_body.append(f"<h2>{l[3:]}</h2>")
        elif l.startswith("### "):
            if em_paragrafo: html_body.append("</p>"); em_paragrafo = False
            html_body.append(f"<h3>{l[4:]}</h3>")
        elif l.startswith("> "):
            if em_paragrafo: html_body.append("</p>"); em_paragrafo = False
            html_body.append(f"<blockquote>{l[2:]}</blockquote>")
        elif l.startswith("- ") or l.startswith("* "):
            if em_paragrafo: html_body.append("</p>"); em_paragrafo = False
            html_body.append(f"<li>{l[2:]}</li>")
        else:
            l = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', l)
            l = re.sub(r'\*(.*?)\*', r'<em>\1</em>', l)
            if not em_paragrafo:
                html_body.append("<p>")
                em_paragrafo = True
            else:
                html_body.append("<br>")
            html_body.append(l)

    if em_paragrafo:
        html_body.append("</p>")

    template_html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>{titulo}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,300;0,400;0,700;1,300&family=Inter:wght@400;600;700&display=swap');
        @page {{ margin: 2.5cm; size: A4; }}
        body {{
            font-family: 'Merriweather', Georgia, serif;
            color: #1a1a1a;
            line-height: 1.8;
            font-size: 16px;
            max-width: 820px;
            margin: 0 auto;
            padding: 40px 20px;
            background-color: #faf9f6;
        }}
        h1, h2, h3, h4 {{
            font-family: 'Inter', sans-serif;
            color: #0f172a;
            font-weight: 700;
            line-height: 1.3;
        }}
        h1.capitulo-titulo {{
            font-size: 2.4rem;
            margin-top: 60px;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 2px solid #e2e8f0;
            page-break-before: always;
        }}
        h2 {{ font-size: 1.6rem; margin-top: 36px; }}
        h3 {{ font-size: 1.25rem; margin-top: 28px; }}
        p {{ margin-bottom: 20px; text-align: justify; text-justify: inter-word; }}
        blockquote {{
            border-left: 4px solid #3b82f6;
            padding: 12px 20px;
            margin: 24px 0;
            background: #eff6ff;
            border-radius: 0 8px 8px 0;
            font-style: italic;
        }}
        li {{ margin-bottom: 8px; }}
        .toolbar {{
            position: fixed;
            top: 15px;
            right: 15px;
            background: #ffffff;
            padding: 10px 18px;
            border-radius: 30px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            display: flex;
            gap: 12px;
            z-index: 999;
        }}
        .toolbar button {{
            background: #2563eb;
            color: white;
            border: none;
            padding: 6px 14px;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 600;
        }}
        .toolbar button:hover {{ background: #1d4ed8; }}
        @media print {{
            .toolbar {{ display: none; }}
            body {{ background: white; padding: 0; }}
        }}
    </style>
</head>
<body>
    <div class="toolbar">
        <span>📖 Edição Traduzida</span>
        <button onclick="window.print()">🖨️ Salvar em PDF</button>
    </div>
    <div class="conteudo-livro">
        {"".join(html_body)}
    </div>
</body>
</html>"""
    with open(caminho_saida_html, "w", encoding="utf-8") as f:
        f.write(template_html)


def processar_traducao_livro(
    caminho_arquivo: str,
    modelo: str = DEFAULT_MODEL,
    tamanho_bloco: int = DEFAULT_MAX_CHARS,
    forcar_glossario: bool = False,
    api_key: Optional[str] = None,
    max_blocos_limite: Optional[int] = None
):
    """Orquestrador completo de tradução para qualquer livro ou documento longo."""
    
    # 0. Configura cliente Gemini (suporta GEMINI_API_KEY ou GOOGLE_API_KEY)
    chave_final = api_key or os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
    if not chave_final:
        console.print("\n[bold red]❌ ERRO: Chave GEMINI_API_KEY não configurada![/bold red]")
        console.print("Configure a variável no seu arquivo .env ou no terminal:")
        console.print("  [cyan]set GEMINI_API_KEY=sua_chave_aqui[/cyan]")
        console.print("Ou passe como argumento: --api-key sua_chave\n")
        sys.exit(1)

    client = genai.Client(api_key=chave_final)

    path_livro = Path(caminho_arquivo).resolve()
    if not path_livro.exists():
        console.print(f"[bold red]❌ Arquivo não encontrado:[/bold red] {path_livro}")
        sys.exit(1)

    extensao = path_livro.suffix.lower()
    nome_base = path_livro.stem
    pasta_destino = path_livro.parent

    # Arquivos de Controle
    caminho_glossario = pasta_destino / f"glossario_{nome_base}.json"
    caminho_checkpoint = pasta_destino / f"checkpoint_{nome_base}.json"

    # Banner Inicial
    console.print(Panel.fit(
        f"[bold white]📚 AGENTE TRADUTOR EDITORIAL DE LIVROS[/bold white]\n"
        f"[dim]Google Gemini 2.5 Flash • Chunking Semântico & Sub-lotes • Memória Deslizante[/dim]\n\n"
        f"📖 [bold cyan]Obra:[/bold cyan] {path_livro.name}\n"
        f"⚡ [bold cyan]Modelo:[/bold cyan] {modelo} | [bold cyan]Formato:[/bold cyan] {extensao.upper()}",
        border_style="blue"
    ))

    # ==========================================================================
    # CASO 1: ARQUIVOS EPUB (.epub)
    # ==========================================================================
    if extensao == ".epub":
        console.print("[cyan]📂 Carregando estrutura interna e capítulos do EPUB...[/cyan]")
        livro_epub = ExtratorEPUB.carregar_livro(str(path_livro))
        tarefas_traducao, amostra_texto = ExtratorEPUB.extrair_unidades_traducao(livro_epub, max_chars=tamanho_bloco)
        
        if not tarefas_traducao:
            console.print("[red]Nenhum capítulo com texto foi encontrado no arquivo EPUB.[/red]")
            return

        total_tarefas = len(tarefas_traducao)
        if max_blocos_limite and max_blocos_limite < total_tarefas:
            console.print(f"[yellow]⚡ Modo Amostra/Teste: Executando apenas os primeiros {max_blocos_limite} lotes de {total_tarefas}.[/yellow]")
            tarefas_traducao = tarefas_traducao[:max_blocos_limite]
        else:
            console.print(f"[cyan]✓ Obra particionada em [bold]{total_tarefas}[/bold] lotes semânticos seguros.[/cyan]")

        # Fase 2: Glossário Editorial
        glossario = gerar_ou_carregar_glossario(
            client=client,
            texto_amostra=amostra_texto,
            caminho_glossario=caminho_glossario,
            modelo=modelo,
            forcar_recriar=forcar_glossario
        )

        # Fase 3: Checkpoint & Tradução
        checkpoint = GerenciadorCheckpoint(
            caminho_checkpoint=caminho_checkpoint,
            total_blocos=total_tarefas,
            metadata={"formato": "epub", "livro": path_livro.name, "modelo": modelo}
        )

        contexto_acumulado = ""

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=console
        ) as progress:
            tarefa = progress.add_task("[green]Traduzindo capítulos...", total=len(tarefas_traducao))

            for i, item_tarefa in enumerate(tarefas_traducao):
                tarefa_id = item_tarefa["id"]
                html_existente = checkpoint.obter_bloco_traduzido(tarefa_id)

                if html_existente:
                    contexto_acumulado = html_existente
                    progress.update(tarefa, advance=1, description=f"[cyan]Lote {i+1}/{len(tarefas_traducao)} (Checkpoint: {item_tarefa['titulo']})")
                    continue

                progress.update(tarefa, description=f"[yellow]Traduzindo {i+1}/{len(tarefas_traducao)} ({item_tarefa['titulo']})...")
                
                html_traduzido = traduzir_bloco_com_resiliencia(
                    client=client,
                    bloco_ingles=item_tarefa["html"],
                    glossario=glossario,
                    contexto_anterior=contexto_acumulado,
                    eh_html=True,
                    modelo=modelo
                )

                checkpoint.salvar_bloco(tarefa_id, html_traduzido)
                contexto_acumulado = html_traduzido
                
                progress.update(tarefa, advance=1)
                time.sleep(1.2)

        # Fase 4: Reconstitui e salva o EPUB traduzido
        saida_epub = pasta_destino / f"{nome_base}_PTBR.epub"
        mapa_completo = checkpoint.obter_mapa_completo()
        ExtratorEPUB.reconstruir_e_salvar_epub(livro_epub, mapa_completo, str(saida_epub), max_chars=tamanho_bloco)
        
        console.print()
        console.print(Panel.fit(
            f"[bold green]✨ TRADUÇÃO CONCLUÍDA COM SUCESSO![/bold green]\n\n"
            f"📕 [bold]EPUB Traduzido:[/bold] {saida_epub}\n"
            f"📋 [bold]Glossário Salvo:[/bold] {caminho_glossario.name}\n"
            f"💾 [bold]Checkpoint:[/bold] {caminho_checkpoint.name}",
            border_style="green"
        ))

    # ==========================================================================
    # CASO 2: ARQUIVOS PDF (.pdf), MARKDOWN (.md) OU TEXTO (.txt)
    # ==========================================================================
    else:
        if extensao == ".pdf":
            console.print("[cyan]📄 Extraindo e convertendo PDF em Markdown estruturado...[/cyan]")
            texto_completo = ExtratorPDF.extrair_markdown(str(path_livro))
        else:
            with open(path_livro, "r", encoding="utf-8", errors="replace") as f:
                texto_completo = f.read()

        blocos = dividir_texto_em_blocos(texto_completo, max_chars=tamanho_bloco)
        total_blocos = len(blocos)
        
        if max_blocos_limite and max_blocos_limite < total_blocos:
            console.print(f"[yellow]⚡ Modo Amostra/Teste: Executando apenas os primeiros {max_blocos_limite} blocos de {total_blocos}.[/yellow]")
            blocos = blocos[:max_blocos_limite]
        else:
            console.print(f"[cyan]✓ Texto dividido em [bold]{total_blocos}[/bold] blocos semânticos.[/cyan]")

        glossario = gerar_ou_carregar_glossario(
            client=client,
            texto_amostra=texto_completo,
            caminho_glossario=caminho_glossario,
            modelo=modelo,
            forcar_recriar=forcar_glossario
        )

        checkpoint = GerenciadorCheckpoint(
            caminho_checkpoint=caminho_checkpoint,
            total_blocos=total_blocos,
            metadata={"formato": extensao[1:], "livro": path_livro.name, "modelo": modelo}
        )

        contexto_acumulado = ""

        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            TimeRemainingColumn(),
            console=console
        ) as progress:
            tarefa = progress.add_task("[green]Traduzindo blocos...", total=len(blocos))

            for i, bloco in enumerate(blocos):
                bloco_id = f"bloco_{i}"
                traducao_existente = checkpoint.obter_bloco_traduzido(bloco_id)

                if traducao_existente:
                    contexto_acumulado = traducao_existente
                    progress.update(tarefa, advance=1, description=f"[cyan]Bloco {i+1}/{len(blocos)} (restaurado do checkpoint)")
                    continue

                progress.update(tarefa, description=f"[yellow]Traduzindo bloco {i+1}/{len(blocos)} (~{len(bloco)} chars)...")

                traducao = traduzir_bloco_com_resiliencia(
                    client=client,
                    bloco_ingles=bloco,
                    glossario=glossario,
                    contexto_anterior=contexto_acumulado,
                    eh_html=False,
                    modelo=modelo
                )

                checkpoint.salvar_bloco(bloco_id, traducao)
                contexto_acumulado = traducao

                progress.update(tarefa, advance=1)
                time.sleep(1.2)

        # Exportação dos Resultados
        mapa = checkpoint.obter_mapa_completo()
        todas_traducoes = [mapa[f"bloco_{i}"] for i in range(len(blocos)) if f"bloco_{i}" in mapa]
        texto_final = "\n\n".join(todas_traducoes)

        saida_md = pasta_destino / f"{nome_base}_PTBR.md"
        with open(saida_md, "w", encoding="utf-8") as f:
            f.write(texto_final)

        saida_html = pasta_destino / f"{nome_base}_PTBR.html"
        exportar_html_diagramado(titulo=nome_base, conteudo_markdown=texto_final, caminho_saida_html=saida_html)

        console.print()
        console.print(Panel.fit(
            f"[bold green]✨ TRADUÇÃO CONCLUÍDA COM SUCESSO![/bold green]\n\n"
            f"📝 [bold]Markdown Traduzido:[/bold] {saida_md}\n"
            f"🌐 [bold]HTML Diagramado (Pronto para PDF):[/bold] {saida_html}\n"
            f"📋 [bold]Glossário Salvo:[/bold] {caminho_glossario.name}\n"
            f"💾 [bold]Checkpoint:[/bold] {caminho_checkpoint.name}\n\n"
            f"[dim]Dica: Abra o arquivo .html no navegador e clique em 'Salvar em PDF' para gerar o livro diagramado![/dim]",
            border_style="green"
        ))


# ==============================================================================
# CLI & ENTRADA INTERATIVA
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Agente Editorial Autônomo para Tradução de Livros Inteiros com Gemini"
    )
    parser.add_argument("--livro", "-l", type=str, help="Caminho do livro (.epub, .pdf, .md, .txt)")
    parser.add_argument("--modelo", "-m", type=str, default=DEFAULT_MODEL, help=f"Modelo Gemini (padrão: {DEFAULT_MODEL})")
    parser.add_argument("--tamanho-bloco", "-b", type=int, default=DEFAULT_MAX_CHARS, help=f"Tamanho máximo de caracteres por bloco (padrão: {DEFAULT_MAX_CHARS})")
    parser.add_argument("--recriar-glossario", action="store_true", help="Força a recriação do glossário mesmo que já exista")
    parser.add_argument("--api-key", type=str, default=None, help="Chave GEMINI_API_KEY (opcional se já estiver no .env)")
    parser.add_argument("--limite-lotes", type=int, default=None, help="Executar apenas N lotes (útil para testes rápidos)")

    args = parser.parse_args()

    caminho_livro = args.livro
    if not caminho_livro:
        console.print("\n[bold cyan]📚 BEM-VINDO AO AGENTE TRADUTOR DE LIVROS EDITORIAL[/bold cyan]")
        console.print("Arraste e solte o arquivo do livro (.epub, .pdf, .md, .txt) aqui ou digite o caminho:\n")
        try:
            caminho_digitado = input("Caminho do livro: ").strip().strip('"').strip("'")
            if not caminho_digitado:
                console.print("[red]Nenhum caminho informado. Encerrando.[/red]")
                return
            caminho_livro = caminho_digitado
        except (KeyboardInterrupt, EOFError):
            return

    processar_traducao_livro(
        caminho_arquivo=caminho_livro,
        modelo=args.modelo,
        tamanho_bloco=args.tamanho_bloco,
        forcar_glossario=args.recriar_glossario,
        api_key=args.api_key,
        max_blocos_limite=args.limite_lotes
    )

if __name__ == "__main__":
    main()
