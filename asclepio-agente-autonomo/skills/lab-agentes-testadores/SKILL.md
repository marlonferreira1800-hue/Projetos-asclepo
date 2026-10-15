---
name: lab-agentes-testadores
description: >-
  Laboratório de Agentes Especialistas em Testes e Auto-Cura de Aplicações v2.0.
  Orquestra um time de agentes autônomos baseado nos padrões de engenharia de ponta
  do SWE-agent, Aider, MetaGPT e AutoCodeRover: Varredura inteligente de RepoMap,
  Scripts de Reprodução Determinísticos, Correção Cirúrgica de Raio Mínimo e Auditoria
  em 3 Barreiras (Linter, Reprodução e Anti-Regressão) com Rollback Atômico Git.
  Ative sempre que o usuário pedir para testar um app, encontrar e corrigir bugs,
  ou diagnosticar problemas em repositórios.
---

# 🧪 Laboratório de Agentes Especialistas em Testes e Auto-Cura de Aplicações v2.0

Inspirado nas arquiteturas líderes do ecossistema de agentes de software (**SWE-agent**, **Aider**, **MetaGPT** e **AutoCodeRover**), este laboratório transforma o ciclo de teste e resolução em um pipeline rigoroso de engenharia.

---

## 🏛️ Arquitetura dos 6 Agentes Especializados

```
┌────────────────────────────────────────────────────────────────────────┐
│                        🎯 AGENTE ORQUESTRADOR                          │
│               (Coordenação, SOPs e Gestão de Checkpoints)              │
├─────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│ 🗺️ SCANNER  │ 🧪 REPRO     │ 🔧 RESOLVER  │ 🛡️ VERIFIER  │ 🧠 MEMÓRIA  │
│ (RepoMap &  │ (Isolamento  │ (Correção    │ (Linter,     │ (Catálogo e │
│  Diagnóstico)│ & Prova)    │  Cirúrgica)  │  Regressão)  │  Padrões)   │
└─────────────┴──────────────┴──────────────┴──────────────┴─────────────┘
```

---

## 🚦 O Pipeline de 5 Etapas com Self-Healing

### Etapa 1 — Reconhecimento Sem Ruído (Scanner & RepoMap)
- **Ferramenta:** `repo_map` + `test_runner` + `code_lint`
- Filtra diretórios pesados (`node_modules`, `.git`, `venv`, `dist`, `target`).
- Monta mapa condensado de arquivos e assinaturas de funções e classes.
- Executa a suíte de testes existente e varre logs de compilação.
- **Saída:** Lista de anomalias com localização precisa e stack traces.

### Etapa 2 — Isolamento e Prova de Falha (Reproductor)
- **Princípio Dourado (SWE-bench):** *Nenhum código é alterado sem antes existir um teste isolado que falhe comprovando o bug.*
- Cria o script `repro_<id>.<ext>`.
- Executa no código original e **garante que ele falha** (Exit Code != 0).
- **Saída:** Script de reprodução determinístico como critério de aceite inegociável.

### Etapa 3 — Resolução Cirúrgica de Raio Mínimo (Resolver)
- **Princípio (Aider / MetaGPT):** *Edição cirúrgica mínima; nunca reescrever arquivos inteiros.*
- Grava ponto de restauração via `git_checkpoint`.
- Aplica a menor modificação de código possível para sanar a causa raiz.
- Valida sintaxe imediatamente com `code_lint` antes de submeter à auditoria.
- **Saída:** Patch cirúrgico testado localmente.

### Etapa 4 — Auditoria em 3 Barreiras & Rollback Atômico (Verifier)
- O Verifier testa o patch contra as **3 Barreiras**:
  1. **Barreira 1 (Linter Sintático):** Compilação limpa sem erros de sintaxe ou imports.
  2. **Barreira 2 (Script de Reprodução):** O script `repro_<id>` agora passa com Exit 0.
  3. **Barreira 3 (Anti-Regressão Global):** Todos os testes prévios do projeto continuam passando.
- **Se reprovado:** Aciona `git_checkpoint(action: "rollback")`, desfaz as alterações e reenvia o traceback ao Resolver (loop de auto-cura até 3 tentativas).
- **Se aprovado:** Homologa o fix e promove o teste para a suíte permanente de regressão.

### Etapa 5 — Documentação e Aprendizado Contínuo (Relator & Memória)
- Gera relatório executivo com dashboard de integridade (% de testes verdes).
- Registra a solução na base de conhecimento `references/memoria.md` com padrão de causa raiz e código reutilizável.

---

## 🛠️ Subagentes Registrados

Quando este skill for invocado, use `define_subagent` e `invoke_subagent` para os agentes:

| Subagente | Role | Prompt de Referência | Ferramentas |
| :--- | :--- | :--- | :--- |
| `lab-scanner` | Architecture & Diagnostic Scanner | `references/prompt-scanner.md` | `repo_map`, `test_runner`, `code_lint`, read tools |
| `lab-reproductor` | Bug Isolation Engineer | `references/prompt-reproductor.md` | `write_to_file`, `execute_command`, `code_lint` |
| `lab-resolver` | Surgical Bug Fix Engineer | `references/prompt-resolver.md` | `replace_file_content`, `code_lint`, `git_checkpoint` |
| `lab-verifier` | QA Auditor & Regression Hunter | `references/prompt-verifier.md` | `test_runner`, `code_lint`, `git_checkpoint`, command tools |
| `lab-relator` | Health Report Writer | `references/prompt-relator.md` | `write_to_file` |
| `lab-memoria` | Pattern Learning Agent | `references/prompt-memoria.md` | `replace_file_content`, `read_file` |

---

## 📁 Base de Memória Persistente

Toda inteligência acumulada fica registrada em:
`C:\Users\marlo\.gemini\config\skills\lab-agentes-testadores\references\memoria.md`

Os agentes sempre consultam esta base antes de iniciar uma nova investigação para reutilizar soluções previamente validadas.
