import { cdpController } from './cdp-controller'
import { BrowserWindow } from 'electron'
import { nvidiaPool, DEFAULT_NVIDIA_API_KEY, AIModel } from './nvidia-pool'

export interface AgentConfig {
  apiKey?: string
  nvidiaApiKey?: string
  modelIndex?: number
  maxSteps?: number
}

export interface AgentStepLog {
  step: number
  type: 'observe' | 'thought' | 'action' | 'result' | 'finish' | 'error'
  title: string
  details?: string
  data?: any
  modelName?: string
}

function normalizePlan(p: any): any {
  if (!p || typeof p !== 'object') return null
  if (p.url && (!p.action || p.action !== 'navigate')) {
    p.action = 'navigate'
  }
  if (p.action === 'open' && p.url) {
    p.action = 'navigate'
  }
  if (p.action === 'play') {
    if (p.url) p.action = 'navigate'
    else if (p.elementId) p.action = 'click'
  }
  if (p.action === 'search' && p.query) {
    p.action = 'fill'
    p.text = p.query
    p.pressEnter = true
  }
  return p
}

/**
 * Extrator ultra-robusto de plano de ação JSON para modelos com Chain of Thought (Thinking Models)
 */
function extractActionPlan(text: string): any {
  if (!text) return null

  // 1. Tenta parse direto
  try {
    const p = JSON.parse(text.trim())
    if (p && typeof p === 'object' && p.action) return normalizePlan(p)
  } catch {}

  // 2. Extrai de blocos ```json ... ``` (da última ocorrência para a primeira)
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)\s*```/g)]
  for (let i = fenced.length - 1; i >= 0; i--) {
    try {
      const candidate = fenced[i][1].trim()
      const p = JSON.parse(candidate)
      if (p && typeof p === 'object' && p.action && p.action !== 'click | fill') {
        return normalizePlan(p)
      }
    } catch {}
  }

  // 3. Procura o último objeto JSON que contenha "action": "..."
  const actionRegex = /\{[^{}]*"action"\s*:\s*"(click|fill|navigate|scroll|finish|open|play|search)"[^{}]*\}/g
  const matches = [...text.matchAll(actionRegex)]
  for (let i = matches.length - 1; i >= 0; i--) {
    try {
      const p = JSON.parse(matches[i][0])
      if (p && p.action) return normalizePlan(p)
    } catch {}
  }

  // 4. Parser de chaves balanceadas de trás para frente
  let lastClose = text.lastIndexOf('}')
  while (lastClose !== -1) {
    let depth = 0
    for (let i = lastClose; i >= 0; i--) {
      if (text[i] === '}') depth++
      else if (text[i] === '{') {
        depth--
        if (depth === 0) {
          const candidate = text.slice(i, lastClose + 1)
          try {
            const p = JSON.parse(candidate)
            if (p && typeof p === 'object' && p.action && !p.action.includes('|')) {
              return normalizePlan(p)
            }
          } catch {}
          break
        }
      }
    }
    lastClose = text.lastIndexOf('}', lastClose - 1)
  }

  return null
}

export class AgentOrchestrator {
  private isRunning = false
  private abortController: AbortController | null = null

  public async runGoal(
    goal: string,
    window: BrowserWindow,
    config: AgentConfig = {}
  ): Promise<void> {
    if (this.isRunning) {
      this.emitLog(window, {
        step: 0,
        type: 'error',
        title: 'Um objetivo já está em execução.'
      })
      return
    }

    this.isRunning = true
    this.abortController = new AbortController()

    const maxSteps = config.maxSteps || 15
    const nvidiaKey = config.nvidiaApiKey || DEFAULT_NVIDIA_API_KEY

    nvidiaPool.setApiKey(nvidiaKey)
    if (typeof config.modelIndex === 'number') {
      nvidiaPool.setModelIndex(config.modelIndex)
    }

    const initialModel = nvidiaPool.getCurrentModel()

    this.emitLog(window, {
      step: 0,
      type: 'thought',
      title: 'Iniciando Missão Autônoma Multi-Modelos',
      details: `Meta: "${goal}"\nModelo Primário: ${initialModel.name} (${initialModel.provider})\nPool: 10 Modelos com Fallback Ativo`,
      modelName: initialModel.name
    })

    const history: string[] = []

    for (let step = 1; step <= maxSteps; step++) {
      if (this.abortController?.signal.aborted) {
        this.emitLog(window, {
          step,
          type: 'finish',
          title: 'Execução cancelada pelo usuário.'
        })
        break
      }

      try {
        // 1. OBSERVAR: Snapshot Semântico via CDP
        const snapshot = await cdpController.getSemanticSnapshot()
        this.emitLog(window, {
          step,
          type: 'observe',
          title: `Observando Página (${snapshot.elements.length} elementos detectados)`,
          details: `${snapshot.title || 'Página'} | ${snapshot.url}`,
          modelName: nvidiaPool.getCurrentModel().name
        })

        // Formata elementos para prompt enxuto (< 2000 tokens)
        const elementsText = snapshot.elements
          .slice(0, 45)
          .map((el) => `[${el.id}] ${el.role}: "${el.name}" (coords: ${el.center.x}, ${el.center.y})`)
          .join('\n')

        const systemMessage = `Você é o Asclepio, um Agente de Navegação Web Autônomo de alta precisão.
Sua missão é atingir o objetivo do usuário navegando na web com emulação física.
IMPORTANTE: Sua resposta DEVE ser um objeto JSON estrito com as seguintes propriedades:
- "thought": raciocínio curto em português (1 frase)
- "action": UMA destas opções exatas: "navigate", "click", "fill", "scroll" ou "finish"
- "url": string com a URL (se action for "navigate")
- "elementId": id do elemento (se action for "click" ou "fill", ex: "elem_1")
- "text": texto para preencher (se action for "fill")
- "pressEnter": boolean (true se deve pressionar Enter após fill)
- "deltaY": número (se action for "scroll", ex: 400)
- "answer": resposta final para o usuário (se action for "finish")

REGRAS CRÍTICAS ANTI-LOOP:
1. Se a página atual já for o site desejado (ex: URL já é youtube.com), NUNCA use "navigate" para a mesma página inicial!
2. Para buscar algo na página atual, use a ação "fill" no campo de busca ou "click" no botão de busca.
3. Se estiver na página de resultados de busca, clique no primeiro vídeo ou link relevante.
4. Quando a música estiver tocando ou a informação estiver na tela, use action "finish".`

        const userMessage = `OBJETIVO DO USUÁRIO: "${goal}"

PÁGINA ATUAL:
Título: ${snapshot.title || 'about:blank'}
URL: ${snapshot.url || 'about:blank'}

ELEMENTOS NA TELA:
${elementsText || '(Nenhum elemento interativo identificado na tela atual)'}

HISTÓRICO RECENTE:
${history.length > 0 ? history.join('\n') : 'Início da navegação.'}

Gere o objeto JSON da próxima ação:`

        // 2. PLANEJAR: Inferência com Auto-Fallback nos 10 Melhores Modelos de IA
        const completion = await nvidiaPool.generateWithFallback(
          [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage }
          ],
          (fromModel: AIModel, toModel: AIModel, reason: string) => {
            this.emitLog(window, {
              step,
              type: 'thought',
              title: `🔄 Auto-Fallback Ativado: Alternando Modelo`,
              details: `O modelo [${fromModel.name}] atingiu limite ou falhou (${reason}).\nAlternado automaticamente para [${toModel.name}].`,
              modelName: toModel.name
            })
          }
        )

        // Extrai o plano de ação ignorando qualquer texto conversacional ou de pensamento
        let plan = extractActionPlan(completion.text)

        if (!plan && completion.reasoning) {
          plan = extractActionPlan(completion.reasoning)
        }

        const lowerGoal = goal.toLowerCase()
        const currentUrl = snapshot.url || ''
        const normCurrent = currentUrl.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')

        // Detecção de Intenção Multimídia e Busca Rápida (Direct Query Routing)
        const isYouTubeIntent = lowerGoal.includes('youtube') || lowerGoal.includes('música') || lowerGoal.includes('musica') || lowerGoal.includes('toque') || lowerGoal.includes('play')
        let youtubeQuery = ''
        if (isYouTubeIntent) {
          youtubeQuery = goal
            .replace(/https?:\/\/[^\s]+/gi, '')
            .replace(/\b(abra|abrir|acesse|acessar|vai|va|procura|procure|busque|buscar|pesquise|pesquisar|coloque|colocar|toque|tocar|play|watch|assista|assistir)\b/gi, '')
            .replace(/\b(o|a|os|as|um|uma|uns|umas|no|na|nos|nas|para|pro|pra|de|do|da|dos|das|em|e|por favor)\b/gi, '')
            .replace(/\b(youtube|música|musica|video|vídeo|clipe|som|faixa|track|song)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
        }

        const isOnlyOpenYouTube = !youtubeQuery || youtubeQuery.toLowerCase() === 'youtube'

        // Detecção de Intenção Google / Busca Geral (com suporte a erros de digitação comuns como "agoogle")
        const isGoogleIntent = lowerGoal.includes('google') || lowerGoal.includes('agoogle')
        let googleQuery = ''
        if (isGoogleIntent) {
          googleQuery = goal
            .replace(/https?:\/\/[^\s]+/gi, '')
            .replace(/\b(abra|abrir|acesse|acessar|vai|va|procura|procure|busque|buscar|pesquise|pesquisar|pesquisaa|pesquisa|coloque|colocar)\b/gi, '')
            .replace(/\b(o|a|os|as|um|uma|uns|umas|no|na|nos|nas|para|pro|pra|de|do|da|dos|das|em|e|por favor|agoogle|google)\b/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
        }
        const isOnlyOpenGoogle = isGoogleIntent && (!googleQuery || googleQuery.length < 2)
        const isOnlyOpenSite = (isYouTubeIntent && isOnlyOpenYouTube) || (isGoogleIntent && isOnlyOpenGoogle)

        // 1. ATALHO INTELIGENTE: Se for YouTube com busca e ainda não estiver na busca nem no vídeo, vai direto para os resultados!
        if (isYouTubeIntent && !isOnlyOpenYouTube && !normCurrent.includes('youtube.com/results') && !normCurrent.includes('youtube.com/watch')) {
          plan = {
            thought: `Navegando diretamente para a busca de "${youtubeQuery}" no YouTube`,
            action: 'navigate',
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`
          }
        }

        // 2. ATALHO INTELIGENTE GOOGLE: Navegação direta ultrarrápida sem rodeios
        if (isGoogleIntent) {
          if (!isOnlyOpenGoogle && !normCurrent.includes('google.com/search')) {
            plan = {
              thought: `Navegando diretamente para a pesquisa de "${googleQuery}" no Google`,
              action: 'navigate',
              url: `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`
            }
          } else if (isOnlyOpenGoogle && !normCurrent.includes('google.com')) {
            plan = {
              thought: 'Acessando a página inicial do Google diretamente',
              action: 'navigate',
              url: 'https://www.google.com'
            }
          } else if (isOnlyOpenGoogle && normCurrent.includes('google.com')) {
            plan = {
              thought: 'A página inicial do Google já está pronta e carregada.',
              action: 'finish',
              answer: 'A página inicial do Google foi carregada com sucesso e está pronta para uso!'
            }
          }
        }

        // Se o modelo falhou no JSON ou caiu em plano vazio:
        if (!plan) {
          if (isYouTubeIntent && !isOnlyOpenYouTube && !normCurrent.includes('youtube.com/results') && !normCurrent.includes('youtube.com/watch')) {
            plan = {
              thought: `Navegando diretamente para os resultados de "${youtubeQuery}" no YouTube`,
              action: 'navigate',
              url: `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`
            }
          } else if (isYouTubeIntent && !normCurrent.includes('youtube.com')) {
            plan = {
              thought: 'Acessando a página inicial do YouTube diretamente',
              action: 'navigate',
              url: 'https://www.youtube.com'
            }
          } else if (normCurrent.includes('youtube.com') && isOnlyOpenYouTube) {
            plan = {
              thought: 'YouTube já está aberto e pronto no navegador.',
              action: 'finish',
              answer: 'O YouTube já está carregado e pronto para uso no painel ao lado.'
            }
          } else {
            plan = {
              thought: completion.text.slice(0, 200),
              action: 'finish',
              answer: completion.text
            }
          }
        }

        // =========================================================================
        // ANTI-LOOP GUARD: Se o modelo tentar navegar para onde já está
        // =========================================================================
        if (plan && plan.action === 'navigate' && plan.url) {
          const normTarget = plan.url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
          const isSameDomain = (normCurrent.startsWith('youtube.com') && normTarget === 'youtube.com') || (normCurrent === normTarget)

          if (isSameDomain) {
            // LOOP DETECTADO! A página já está no YouTube/Google!
            if (isOnlyOpenSite) {
              plan = {
                thought: '[Anti-Loop] YouTube já se encontra carregado na tela.',
                action: 'finish',
                answer: 'A página inicial do YouTube foi carregada com sucesso e está pronta para uso.'
              }
            } else if (isYouTubeIntent && youtubeQuery && !normCurrent.includes('results') && !normCurrent.includes('watch')) {
              plan = {
                thought: `[Anti-Loop] Já na página inicial. Navegando diretamente para resultados de "${youtubeQuery}"`,
                action: 'navigate',
                url: `https://www.youtube.com/results?search_query=${encodeURIComponent(youtubeQuery)}`
              }
            } else {
              const searchInput = snapshot.elements.find((e) =>
                e.role === 'combobox' || e.role === 'searchbox' || e.name.toLowerCase().includes('pesquisar') || e.name.toLowerCase().includes('search')
              )
              const videoItem = snapshot.elements.find((e) =>
                e.name.length > 3 && (e.role === 'link' || e.role === 'heading') && !e.name.toLowerCase().includes('início') && !e.name.toLowerCase().includes('shorts')
              )

              if (videoItem && normCurrent.includes('results')) {
                plan = {
                  thought: `[Anti-Loop] Clicando no primeiro vídeo dos resultados: "${videoItem.name}"`,
                  action: 'click',
                  elementId: videoItem.id
                }
              } else if (searchInput) {
                plan = {
                  thought: `[Anti-Loop] Localizado campo de busca. Digitando termo desejado`,
                  action: 'fill',
                  elementId: searchInput.id,
                  text: youtubeQuery || goal,
                  pressEnter: true
                }
              } else {
                plan = {
                  thought: '[Anti-Loop] Página carregada com sucesso.',
                  action: 'finish',
                  answer: `Página ${snapshot.title} carregada e pronta para interação.`
                }
              }
            }
          }
        }

        // Se estiver nos resultados do YouTube e ainda não no vídeo (/watch), toca o primeiro vídeo imediatamente
        if (isYouTubeIntent && !isOnlyOpenSite && normCurrent.includes('results') && !normCurrent.includes('watch')) {
          // 1. Procura se há algum elemento com link de vídeo (/watch) já detectado no snapshot
          const watchLink = snapshot.elements.find((e) => e.href && e.href.includes('/watch'))
          if (watchLink && watchLink.href) {
            plan = {
              thought: `Navegando diretamente para o vídeo "${watchLink.name}"`,
              action: 'navigate',
              url: watchLink.href
            }
          } else {
            // 2. Aciona o play direto no primeiro vídeo via CDP (com auto-navigate garantido)
            const playRes = await cdpController.playFirstYouTubeVideo()
            if (playRes && playRes.success && playRes.url) {
              plan = {
                thought: `Reproduzindo vídeo selecionado: "${playRes.title || youtubeQuery}"`,
                action: 'navigate',
                url: playRes.url
              }
            } else {
              // 3. Fallback: clica no link do primeiro vídeo
              const videoItem = snapshot.elements.find((e) =>
                e.name.length > 3 && (e.role === 'link' || e.role === 'heading') && !e.name.toLowerCase().includes('início') && !e.name.toLowerCase().includes('shorts')
              )
              if (videoItem) {
                plan = {
                  thought: `Clicando no vídeo "${videoItem.name}" para iniciar a reprodução`,
                  action: 'click',
                  elementId: videoItem.id
                }
              }
            }
          }
        }

        // Se o vídeo já estiver tocando (/watch), finaliza com mensagem de sucesso
        if (normCurrent.includes('watch') && isYouTubeIntent) {
          plan = {
            thought: 'Vídeo em reprodução com sucesso no YouTube.',
            action: 'finish',
            answer: `▶️ Reproduzindo agora com sucesso: ${snapshot.title || youtubeQuery || 'música'} no YouTube!`
          }
        }

        this.emitLog(window, {
          step,
          type: 'thought',
          title: `Decisão de IA (${completion.modelName})`,
          details: plan.thought || `Ação: ${plan.action}`,
          modelName: completion.modelName
        })

        // 3. AGIR: Executar Ação Física no Browser
        if (plan.action === 'finish') {
          this.emitLog(window, {
            step,
            type: 'finish',
            title: 'Objetivo Concluído!',
            details: plan.answer || 'Missão finalizada pela IA.',
            modelName: completion.modelName
          })
          break
        }

        if (plan.action === 'navigate' && plan.url) {
          let targetUrl = plan.url
          if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = 'https://' + targetUrl
          }
          this.emitLog(window, {
            step,
            type: 'action',
            title: `Navegando para: ${targetUrl}`,
            modelName: completion.modelName
          })
          await cdpController.navigate(targetUrl)
          window.webContents.send('browser:url-changed', targetUrl)
          history.push(`Passo ${step}: Navegou para ${targetUrl}`)

          // Se a intenção era apenas abrir a página inicial (Google ou YouTube), finaliza imediatamente com sucesso
          if ((isOnlyOpenGoogle && targetUrl.includes('google.com')) || (isOnlyOpenYouTube && targetUrl.includes('youtube.com') && !youtubeQuery)) {
            await new Promise((r) => setTimeout(r, 600))
            const siteLabel = targetUrl.includes('google') ? 'Google' : 'YouTube'
            this.emitLog(window, {
              step,
              type: 'finish',
              title: 'Objetivo Concluído!',
              details: `A página inicial do ${siteLabel} foi carregada com sucesso e está pronta para uso.`,
              modelName: completion.modelName
            })
            break
          }
        } else if (plan.action === 'click' && plan.elementId) {
          const target = snapshot.elements.find((e) => e.id === plan.elementId)
          if (target) {
            this.emitLog(window, {
              step,
              type: 'action',
              title: `Clicando em: ${target.name || target.role}`,
              details: `Coordenadas: (${target.center.x}, ${target.center.y})`,
              modelName: completion.modelName
            })
            // Se o elemento for um link com href (ex: vídeo do YouTube /watch), navega diretamente para evitar bloqueio por overlays
            if (target.href && (target.href.includes('/watch') || target.href.startsWith('http'))) {
              await cdpController.navigate(target.href)
              window.webContents.send('browser:url-changed', target.href)
              history.push(`Passo ${step}: Navegou diretamente para "${target.name}" (${target.href})`)
            } else {
              await cdpController.clickPhysical(target.center.x, target.center.y)
              history.push(`Passo ${step}: Clicou em "${target.name}" (${target.id})`)
            }
          } else {
            this.emitLog(window, {
              step,
              type: 'error',
              title: `Elemento ${plan.elementId} não encontrado na tela.`,
              modelName: completion.modelName
            })
          }
        } else if (plan.action === 'fill' && plan.elementId) {
          const target = snapshot.elements.find((e) => e.id === plan.elementId)
          if (target) {
            this.emitLog(window, {
              step,
              type: 'action',
              title: `Digitando: "${plan.text}"`,
              details: `Alvo: ${target.name || target.role}`,
              modelName: completion.modelName
            })
            await cdpController.fillInput(target.center.x, target.center.y, plan.text || '')
            if (plan.pressEnter) {
              await new Promise((r) => setTimeout(r, 200))
              await cdpController.pressKey('Enter')
            }
            history.push(`Passo ${step}: Digitou "${plan.text}" no campo "${target.name}"`)
          }
        } else if (plan.action === 'scroll') {
          const delta = plan.deltaY || 400
          this.emitLog(window, {
            step,
            type: 'action',
            title: `Rolando a página (${delta > 0 ? 'para baixo' : 'para cima'})`,
            modelName: completion.modelName
          })
          await cdpController.scroll(delta)
          history.push(`Passo ${step}: Rolou ${delta}px`)
        }

        // Aguarda estabilização da página para o próximo turno
        await new Promise((r) => setTimeout(r, 2000))
      } catch (err: any) {
        this.emitLog(window, {
          step,
          type: 'error',
          title: `Erro durante o passo ${step}`,
          details: err.message || String(err)
        })
        break
      }
    }

    this.isRunning = false
  }

  public stop(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
    this.isRunning = false
  }

  private emitLog(window: BrowserWindow, log: AgentStepLog): void {
    if (!window.isDestroyed()) {
      window.webContents.send('agent:log', log)
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator()
