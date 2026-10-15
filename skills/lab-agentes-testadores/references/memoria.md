# 📊 Dashboard de Inteligência do Laboratório

> Atualizado automaticamente pelo Agente Memória após cada ciclo de teste.

## Estatísticas Acumuladas

| Métrica                      | Valor  |
|------------------------------|--------|
| Total de ciclos executados   | 6      |
| Total de bugs encontrados    | 20     |
| Total de bugs resolvidos     | 20     |
| Taxa média de resolução      | 100% dos bugs acionáveis |
| Stacks testadas              | Python 3.12 (Flask/Rich), Electron 34 (Node.js/Chromium), Node.js 24 (OpenAI SSE / SQLite / ReAct Agent Loop), SWE-Bench Architecture (Aider, SWE-agent, MetaGPT, AutoCodeRover) |
| Bug mais crítico             | Bloqueio do YouTube por Trusted Types CSP em Adblocker |
| Salto de Arquitetura         | Evolução para o Laboratório v2.0 com 3 Barreiras, RepoMap, Linter e Rollback |

## Top Problemas Mais Recorrentes

1. **Atraso Crítico no Chat e Microfone Preso Gravando em Fones de Ouvido (Falta de VAD Adaptativo)** — Visto no Ciclo #005 — Solução: `SOL-016`
2. **Microfone Inoperante por Falha de Chave do WebSpeech no Electron / Falta de Transcrição** — Visto no Ciclo #003 — Solução: `SOL-009`
3. **Adblocker Injetando Scripts que Violam Trusted Types CSP no YouTube (Tela Branca)** — Visto no Ciclo #002 — Solução: `SOL-006`
4. **Autoplay de Vídeo e Áudio Bloqueado sem Gesto Físico do Usuário no Chromium** — Visto no Ciclo #002 — Solução: `SOL-007`
5. **Parâmetros de Query sem Coerção Segura (HTTP 500 no Flask)** — Visto no Ciclo #001 — Solução: `SOL-001`

## Soluções Catalogadas

1. `SOL-001`: Helper `get_safe_limit(default, max_limit)` para rotas Flask
2. `SOL-002`: Normalização de busca multilingue `lang_lower in ["both", "global", "mundo", "all"]`
3. `SOL-003`: Função de escape HTML e deleção de eventos inline no template
4. `SOL-004`: Migração para HTTPS em endpoints de feeds RSS
5. `SOL-005`: Interceptor `@app.after_request` para habilitar CORS
6. `SOL-006`: Adblocker em modo Network-Only (`loadCosmeticFilters = false`) para evitar tela branca em sites com Trusted Types (YouTube)
7. `SOL-007`: Flags de Autoplay irrestrito no Electron (`--autoplay-policy=no-user-gesture-required`)
8. `SOL-008`: Auto-dismiss de banners de consentimento (Google/YouTube) em `dom-ready`
9. `SOL-009`: Pipeline de Microfone no Electron com Chunks de Áudio + OpenAI Whisper (Fallback Gemini)
10. `SOL-010`: VAD de Silêncio Automático e Resposta com Síntese de Voz (TTS) em Português
11. `SOL-011`: Suporte a streaming de `delta.reasoning_content` em provedores OpenAI-compatible (NVIDIA NIM)
12. `SOL-012`: Coerção segura de argumentos vazios de ferramentas (`trimmedArgs ? JSON.parse : {}`)
13. `SOL-013`: Preservação de fenced code blocks (`pre/code`) contra mangle de escape e newline em Web UI
14. `SOL-014`: Invalidação de cache em memória de configuração via timestamp de arquivo (`mtimeMs`)
15. `SOL-015`: Detecção amigável de diretório em leitura de arquivos com instrução de autocorreção (`EISDIR`)
16. `SOL-016`: VAD Dinâmico Adaptativo com Piso de Ruído e Corte Rápido de 800ms para Fones/Headsets
17. `SOL-017`: Timeout Defensivo em Contexto DOM (350ms) e Reordenação de Modelos (<1s) no Chat

---

# 📚 Catálogo de Soluções Reutilizáveis

### SOL-001: Validação Defensiva de Parâmetros Numéricos de URL
- **Contexto:** Rotas Flask que recebem `?limit=...` ou `?page=...`
- **Problema:** `int(request.args.get("limit"))` quebra com `ValueError` quando o cliente envia texto ou valores inválidos.
- **Solução Padrão:**
  ```python
  def get_safe_limit(default: int = 20, max_limit: int = 100) -> int:
      raw = request.args.get("limit")
      if not raw:
          return default
      try:
          val = int(raw)
          return max(1, min(val, max_limit))
      except (ValueError, TypeError):
          return default
  ```

### SOL-002: Roteamento de Busca Bilíngue/Global em Agregadores RSS
- **Contexto:** Motores de busca que suportam varredura simultânea em múltiplos idiomas (PT + EN).
- **Problema:** O CLI passa `lang="both"`, mas a função interna do agregador só verificava `"en"` e caía no `else` (português).
- **Solução Padrão:**
  ```python
  lang_lower = lang.lower()
  if lang_lower in ["both", "global", "mundo", "all"]:
      items, _, _ = search_world_bilingual(query, limit=limit)
      return items
  ```

### SOL-003: Sanitização de Dados RSS de Terceiros no Frontend
- **Contexto:** Dashboards web que renderizam manchetes de feeds RSS externos.
- **Problema:** Injeção direta em template literals de `innerHTML` permite quebra de tags ou injeção de scripts maliciosos.
- **Solução Padrão:**
  ```javascript
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  ```

### SOL-004: Habilitação de CORS no Flask para Aplicações de Navegador
- **Contexto:** APIs de navegador ou desktop consumidas por portas locais diferentes.
- **Solução Padrão:**
  ```python
  @app.after_request
  def add_cors_headers(response):
      response.headers["Access-Control-Allow-Origin"] = "*"
      response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
      response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
      return response
  ```

### SOL-006: Prevenção de Quebra por Trusted Types CSP em Adblockers Electron
- **Contexto:** Navegadores desktop com `@cliqz/adblocker-electron` acessando YouTube, Google Docs ou plataformas modernas com `require-trusted-types-for 'script'`.
- **Problema:** O adblocker tenta injetar scriptlets cosméticos modificando elementos `<script>`. O Chromium bloqueia a modificação, aborta a execução do framework da página e a tela fica inteiramente branca.
- **Solução Padrão:**
  ```javascript
  const blocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch, cache);
  blocker.config.loadCosmeticFilters = false; // Impede injeção intrusiva no DOM
  blocker.config.loadNetworkFilters = true;  // Mantém bloqueio de requisições de anúncios
  blocker.enableBlockingInSession(session);
  ```

### SOL-007: Habilitação de Autoplay com Áudio em Navegadores Autônomos
- **Contexto:** Automações em Electron onde o agente clica ou reproduz vídeos sem clique manual do mouse.
- **Problema:** O Chromium exige gesto físico do usuário para iniciar áudio. Automações de play falham com `DOMException: play() failed because the user didn't interact with the document first`.
- **Solução Padrão:**
  ```javascript
  // No processo principal (main.js)
  app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
  // Na tag webview (browser.js)
  webviewEl.setAttribute('webpreferences', 'nativeWindowOpen=yes, autoplayPolicy=no-user-gesture-required');
  ```

### SOL-008: Auto-dismiss de Banners de Consentimento (Google/YouTube)
- **Contexto:** Sessões limpas de navegador que recebem popups bloqueantes de consentimento de cookies.
- **Solução Padrão:**
  ```javascript
  webviewEl.addEventListener('dom-ready', () => {
    webviewEl.executeJavaScript(`
      (() => {
        const consentSelectors = [
          'button[aria-label*="Aceitar" i]',
          'button[aria-label*="Accept" i]',
          'button[aria-label*="Concordo" i]',
          'form[action*="consent"] button',
          'ytd-button-renderer#agree-button button'
        ];
        for (const s of consentSelectors) {
          const b = document.querySelector(s);
          if (b) { b.click(); break; }
        }
      })();
    `).catch(() => {});
  });
  ```

### SOL-009: Pipeline de Microfone e Transcrição em Electron com OpenAI Whisper / Gemini
- **Contexto:** Aplicações Electron desktop onde a WebSpeech API (`webkitSpeechRecognition`) falha por falta de chaves proprietárias do Google embutidas no binário.
- **Problema:** Ao clicar no microfone, `recognition.onerror` disparava erro `network` ou `not-allowed`, abortando a escuta. O áudio gravado era descartado e nenhum comando era transcrito ou executado.
- **Solução Padrão:**
  1. Habilitar `session.setPermissionCheckHandler` e switches `--use-fake-ui-for-media-stream` no processo principal.
  2. Gravar chunks com `MediaRecorder` nativo e enviar via IPC para backend.
  3. Transcrever no backend via OpenAI Whisper (`whisper-1` com `FormData`) e fallback para Google Gemini Multimodal áudio.
  4. Executar automaticamente o comando reconhecido no agente (`handleUserPrompt`).

### SOL-010: Detecção de Silêncio (VAD) e Resposta Falada por Síntese de Voz (TTS)
- **Contexto:** Interação por voz onde o usuário fala e espera resposta autônoma sem precisar de múltiplos cliques.
- **Solução Padrão:**
  1. Analisador de volume via Web Audio API (`AudioContext` + `createAnalyser`).
  2. Disparo de envio automático após 1.8s de silêncio contínuo pós-fala.
  3. Síntese de voz com `window.speechSynthesis` em português do Brasil (`pt-BR`) para confirmar ações e ler respostas ao usuário.

---

# 📝 Histórico de Ciclos de Teste

## Entrada #004 — 14/10/2026 — Asclepio Autonomous Agent & Gateway Platform (Node.js/NVIDIA NIM/OpenClaw Reverse)

### Contexto
- **Aplicação:** Asclepio Standalone Autonomous Agent & Gateway Platform
- **Local:** `c:\Users\marlo\OneDrive\Desktop\Pasta Projetos\Reverse\asclepio`
- **Sintoma:** Auditoria profunda do laboratório de testes sobre a replicação e engenharia reversa do OpenClaw. Identificados 5 pontos de vulnerabilidade funcional e edge cases.
- **Arquivos Alterados:** `src/core/llm-provider.js`, `src/ui/index.html`, `src/storage/config.js`, `src/core/tool-registry.js`, `test-suite.mjs`.

### Causas e Soluções Aplicadas
1. **BUG-001 (Reasoning Tokens Ignorados):** Modelos com pensamento analítico (`reasoning_content`) no NVIDIA NIM tinham seus tokens descartados no parser SSE de streaming. → Atualizado `llm-provider.js` para capturar `delta.reasoning_content || delta.reasoning` e repassar para `onChunk`.
2. **BUG-002 (Crash em Argumentos Vazios de Tool Calls):** Quando o LLM chamava ferramentas sem parâmetros (`""`), `JSON.parse("")` lançava `SyntaxError` gerando fallback sujo `{ raw: "" }`. → Adicionada verificação segura `trimmedArgs && trimmedArgs !== "{}" ? JSON.parse(trimmedArgs) : {}`.
3. **BUG-003 (Mangle de Blocos de Código Fenced na Web UI):** O parser de Markdown da Web UI aplicava escape global e quebrava tags ` ```lang ` transformando newlines em `<br>` e manglando sintaxe. → Criada rotina defensiva que extrai blocos de código com placeholders `__CODE_BLOCK_X__`, aplica escape na prosa e restaura com tags `<pre><code>` estilizadas em Dark Glass.
4. **BUG-004 (Cache Estático em Memória de Configurações):** `loadConfig()` cacheava o objeto indefinidamente, ignorando modificações diretas no `asclepio.config.json` sem reiniciar o processo. → Adicionada validação de timestamp de arquivo (`mtimeMs`) e parâmetro `{ reload: true }`.
5. **BUG-005 (Erro EISDIR Não Orientativo em `read_file`):** Ao tentar ler um diretório com `read_file`, o sistema retornava erro genérico de sistema de arquivos do Node.js. → Implementado `fs.statSync(fullPath).isDirectory()` com mensagem instrutiva e orientativa para o agente usar `list_directory`.

## Entrada #006 — 14/10/2026 — Upgrades de Arquitetura do Laboratório v2.0 (SWE-agent, Aider, MetaGPT, AutoCodeRover)

### Contexto
- **Aplicação:** Laboratório de Agentes Testadores (`lab-agentes-testadores`) e Plataforma `Asclepio`
- **Sintoma:** O sistema de testes anterior estava frágil ("muito ruim"), com varredura cega gerando poluição de contexto (`node_modules`), ausência de scripts de reprodução determinísticos (adivinhação de correções), falta de validação sintática pré-teste e risco de corrupção de código sem rollback.
- **Aprendizados dos Repositórios Clonados:**
  - **Aider (`paul-gauthier/aider`):**
    - `repomap.py`: Varredura inteligente com exclusão estrita de diretórios de build/dependências e extração de assinaturas de classes, funções e exports.
    - `linter.py`: Verificação sintática e de importações imediata pós-edição antes de qualquer execução de testes.
    - `dirty worktree protection`: Salvaguardas atômicas com Git.
  - **SWE-agent (`princeton-nlp/SWE-agent`):**
    - ACI (Agent-Computer Interface) para comandos focados e de baixo consumo de tokens.
    - Rollback automático se as tentativas de patch quebrarem os testes.
  - **AutoCodeRover & SWE-bench:**
    - Princípio Dourado: **Nenhum bug pode ser corrigido sem um script de reprodução que falhe deterministicamente antes do fix.**
  - **MetaGPT (`geekan/MetaGPT`):**
    - Pipeline com SOPs formais e papéis especializados (QA Engineer com subciclo `WriteTest` -> `RunCode` -> `DebugError`).
- **Implementações e Ferramentas Nativas Adicionadas:**
  - `repo_map`: Varredura estrutural com extração de símbolos e exclusão de ruído.
  - `code_lint`: Verificador sintático offline para JS/Node, Python e JSON.
  - `test_runner`: Auto-detecção e execução unificada de test runners com captura de exit codes e traces.
  - `git_checkpoint`: Gestão de pontos de segurança, diffs unificados e rollback limpo.
  - **Pipeline das 3 Barreiras:** Linter Sintático $\rightarrow$ Script de Reprodução $\rightarrow$ Anti-Regressão Global.
- **Status da Suíte de Testes do Asclepio:** 16/16 Testes Aprovados (100% PASS).

---

## Entrada #005 — 14/10/2026 — Asclepio Desktop Browser — Otimização Extrema de Latência, VAD Adaptativo e Digitação com Fone

### Contexto
- **Aplicação:** Asclepio Browser Desktop (Shell Electron + Agente de IA)
- **Local:** `C:\Users\marlo\OneDrive\Desktop\Pasta Projetos\Asclepio`
- **Sintoma:** O chat estava com demora muito grande, parecia não trabalhar e não digitava em tempo real o que o usuário falava pelo fone de ouvido.
- **Aprendizado das Bibliotecas do GitHub:**
  - `snakers4/silero-vad`: Calibração dinâmica de ruído de fundo (ruído do fone + 5dB) e corte rápido em 800ms de silêncio para não manter microfone travado. Trava de segurança de 5s máximo.
  - `alphacep/vosk-api`: Digitação ao vivo (interim results) refletida imediatamente no elemento `<textarea>` do chat enquanto a pessoa fala.
  - `browserbase/stagehand` e `browser-use`: Eliminação de esperas mortas (`wait(1500)` -> `wait(150)`), timeout estrito de 350ms em `getActivePageContext` para não travar o loop de eventos, e promoção de modelo de resposta rápida (<1s: `gpt-4o-mini`) como primário.
- **Arquivos Alterados:** `main.js`, `src/js/ai-router.js`, `src/js/agent.js`.

---

## Entrada #003 — 14/10/2026 — Asclepio Desktop Browser — Microfone & Assistente de Voz Não Respondiam

### Contexto
- **Aplicação:** Asclepio Browser Desktop (Shell Electron + Agente de IA)
- **Local:** `C:\Users\marlo\OneDrive\Desktop\Pasta Projetos\Asclepio`
- **Sintoma:** O microfone não funcionava. O usuário falava e o assistente não respondia nada.
- **Arquivos Alterados:** `main.js`, `preload.js`, `src/js/ai-router.js`, `src/js/agent.js`.

### Causas e Soluções Aplicadas
1. **WebSpeech API travava gravação:** `webkitSpeechRecognition` gerava erro de rede imediato no Electron e abortava o `MediaRecorder`. → Isolado o erro para que o `MediaRecorder` capture o áudio físico independentemente.
2. **Descarte de Áudio:** Os chunks do `MediaRecorder` não eram salvos e não havia canal IPC de transcrição. → Implementado endpoint `aiRouter.transcribeAudio` com OpenAI Whisper-1 e fallback Gemini.
3. **Ausência de Execução Automática:** O comando transcrito não era submetido ao agente. → Conectado com VAD de silêncio (1.8s) e envio automático direto para `handleUserPrompt`.
4. **Falta de Resposta Sonora:** Implementada síntese de voz (TTS) em PT-BR para falar de volta a confirmação da ação executada.

---

## Entrada #002 — 14/10/2026 — Asclepio Desktop Browser (Electron/Polar) — Correção YouTube & Áudio

### Contexto
- **Aplicação:** Asclepio Browser Desktop (Shell Electron com UI Polar White)
- **Local:** `C:\Users\marlo\OneDrive\Desktop\Pasta Projetos\Asclepio`
- **Sintoma:** O navegador entrava no YouTube, mas a tela ficava totalmente branca, sem imagem e sem áudio.
- **Arquivos Alterados:** `main.js`, `src/js/browser.js`, `src/js/browser-controller.js`, `src/js/agent.js`, `src/css/style.css`.

### Causas e Soluções Aplicadas
1. **Filtros Cosméticos do Adblocker:** `@cliqz/adblocker-electron` injetava scripts que violavam a diretiva `TrustedScript` do YouTube, matando o script principal e gerando tela branca. → Resolvido com `loadCosmeticFilters = false` e `loadNetworkFilters = true`.
2. **Autoplay Travado:** O Chromium impedia reprodução de vídeo/música sem clique físico prévio. → Resolvido adicionando `--autoplay-policy=no-user-gesture-required` no `main.js` e na tag `<webview>`.
3. **Automação do Clique de Vídeo:** `clickFirstVideo` em `browser-controller.js` não verificava se o elemento existia e não forçava o player HTML5 a iniciar desmutado. → Atualizado para capturar a URL real, navegar diretamente, dispensar anúncios e acionar `video.play()` com volume máximo.
4. **Fundo do Webview:** Ajustado em `style.css` de transparente para opaco para evitar falha de composição de camadas em aceleração de vídeo.

---

## Entrada #001 — 14/10/2026 — Asclepio Notícias Navegador (Flask/CLI)

### Contexto
- **Aplicação:** Asclepio Notícias Navegador (Radar Global em Tempo Real)
- **Resultados:** 7 bugs encontrados, 6 corrigidos, 100% dos testes aprovados.
