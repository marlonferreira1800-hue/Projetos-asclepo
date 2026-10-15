# 🧪 Guia de Orquestração do Laboratório de Agentes v2.0 (SWE & Multi-Agent)

Este documento descreve como o **Agente Orquestrador** coordena o time especializado de 6 subagentes durante um ciclo de auditoria, reprodução e cura de código.

---

## 🏛️ Fluxo de Execução com Self-Healing e 3 Barreiras

```
USUÁRIO → "Testa a aplicação X e corrige os problemas"
    │
    ▼
┌────────────────────────────────────────────────────────┐
│  🎯 ORQUESTRADOR: Preparação e Checkpoint Inicial      │
│  1. Consulta soluções catalogadas na memória prévia    │
│  2. Cria Checkpoint Git de segurança (estado limpo)    │
│  3. Inicia o pipeline de especialistas                 │
└──────────┬─────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│  🔍 SCANNER: Varredura Inteligente & RepoMap           │
│  - Gera mapa de arquivos e símbolos sem ruído          │
│  - Detecta frameworks e executa testes existentes      │
│  - Valida integridade e identifica pontos de quebra    │
│  → OUTPUT: Lista de anomalias com stack traces         │
└──────────┬─────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│  🧪 REPRODUCTOR: Isolamento & Script de Reprodução     │
│  - Cria script isolado 'repro_<id>.<ext>'              │
│  - PROVA a falha no código original (Exit != 0)        │
│  - Define o critério determinístico de aceite          │
│  → OUTPUT: Scripts de reprodução validados             │
└──────────┬─────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│  🔧 RESOLVER: Resolução Cirúrgica                      │
│  - Identifica causa raiz e planeja diff mínimo         │
│  - Executa substituição cirúrgica                      │
│  - Valida sintaxe com linter imediato                  │
│  → OUTPUT: Patch cirúrgico aplicado                    │
└──────────┬─────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│  🛡️ VERIFIER: Auditoria Independente & Anti-Regressão  │
│  - Barreira 1: Linter sintático (0 erros)              │
│  - Barreira 2: Script de reprodução (Exit Code 0)      │
│  - Barreira 3: Suíte global do projeto (0 regressões)  │
│                                                        │
│  [SE FALHAR] → Aciona ROLLBACK Git e instrui Resolver  │
│                (Loop de auto-cura até 3 rodadas)       │
│  [SE APROVAR] → Homologa fix e promove teste perene    │
└──────────┬─────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────────┐
│  📋 RELATOR & 🧠 MEMÓRIA: Entrega e Aprendizado        │
│  - Gera relatório estruturado de saúde                 │
│  - Registra a solução na base de conhecimento          │
│  - Apresenta métricas executivas ao usuário            │
└────────────────────────────────────────────────────────┘
```

---

## 🤖 Definição dos Subagentes no Laboratório

O Orquestrador define os seguintes subagentes especializados:

### 1. `lab-scanner` — Scanner e Mapeador
- **Role:** "App Architecture & Diagnostic Scanner"
- **System Prompt:** `references/prompt-scanner.md`
- **Ferramentas:** `repo_map`, `test_runner`, `code_lint`, `read_file`, `execute_command`.

### 2. `lab-reproductor` — Engenheiro de Reprodução
- **Role:** "Bug Isolation & Reproduction Engineer"
- **System Prompt:** `references/prompt-reproductor.md`
- **Ferramentas:** `write_file`, `read_file`, `execute_command`, `code_lint`.

### 3. `lab-resolver` — Engenheiro de Correção Cirúrgica
- **Role:** "Surgical Bug Fix Engineer"
- **System Prompt:** `references/prompt-resolver.md`
- **Ferramentas:** `replace_file_content`, `edit_file`, `read_file`, `code_lint`, `git_checkpoint`.

### 4. `lab-verifier` — Auditor de Regressão e Rollback
- **Role:** "QA Auditor & Regression Hunter"
- **System Prompt:** `references/prompt-verifier.md`
- **Ferramentas:** `test_runner`, `code_lint`, `git_checkpoint`, `execute_command`, `read_file`.

### 5. `lab-relator` — Relator Técnico
- **Role:** "Bug Report & Health Dashboard Writer"
- **System Prompt:** `references/prompt-relator.md`
- **Ferramentas:** `write_to_file`, `read_file`.

### 6. `lab-memoria` — Curador de Conhecimento
- **Role:** "Learning Memory & Pattern Cataloguer"
- **System Prompt:** `references/prompt-memoria.md`
- **Ferramentas:** `write_to_file`, `replace_file_content`, `read_file`.

---

## 🔄 Protocolo de Auto-Cura (Self-Healing Loop)

Quando uma intervenção do Resolver falhar na auditoria do Verifier:
1. O Verifier executa `git_checkpoint(action: "rollback")`.
2. O Verifier monta um pacote de diagnóstico com o traceback da falha e o teste que quebrou.
3. O Orquestrador re-encaminha o pacote para o Resolver com contador de rodada `Round {N}/3`.
4. O Resolver reanalisa a causa raiz levando em consideração o novo caso de borda.
5. Se na 3ª rodada o fix ainda não passar nas 3 barreiras, o código permanece em rollback e o bug é reportado como `Requer Intervenção de Arquitetura Humana`.
