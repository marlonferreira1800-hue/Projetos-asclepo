import fs from 'fs'
import path from 'path'

export interface AIModel {
  id: string
  name: string
  provider: string
  description: string
}

export const TOP_10_NVIDIA_MODELS: AIModel[] = [
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Meta Llama 3.2 Vision (11B)',
    provider: 'Meta',
    description: 'Ultra-rápido (~1.0s), excelente compreensão visual e comandos diretos.'
  },
  {
    id: 'google/gemma-4-31b-it',
    name: 'Google Gemma 4 (31B IT)',
    provider: 'Google',
    description: 'Raciocínio lógico do Google (~1.2s), excelente decomposição de tarefas.'
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'NVIDIA Nemotron 3 Super (120B)',
    provider: 'NVIDIA',
    description: 'Modelo massivo de 120B com inteligência superior.'
  },
  {
    id: 'nvidia/nemotron-3.5-super-vl-120b-a12b',
    name: 'NVIDIA Nemotron 3.5 Super VL (120B)',
    provider: 'NVIDIA',
    description: 'Visão e linguagem multimodais em grande escala.'
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'OpenAI GPT OSS (20B)',
    provider: 'OpenAI',
    description: 'Modelo de instruções versátil para navegação web.'
  },
  {
    id: 'stepfun-ai/step-5-preview',
    name: 'StepFun Step 5 Preview',
    provider: 'StepFun',
    description: 'Modelo de raciocínio lógico avançado de última geração.'
  },
  {
    id: 'z-ai/glm-5.3',
    name: 'GLM 5.3',
    provider: 'Z-AI',
    description: 'Capacidade analítica avançada e geração de comandos estruturados.'
  },
  {
    id: 'google/diffusiongemma-26b-a4b-it',
    name: 'Google Diffusion Gemma (26B IT)',
    provider: 'Google',
    description: 'Arquitetura multimodal do Google para análise contextual de telas.'
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Meta Llama 3.2 Vision (90B)',
    provider: 'Meta',
    description: 'Grande porte com alta capacidade de generalização visual.'
  },
  {
    id: 'nvidia/nemotron-3.5-lightning-30b-a3b',
    name: 'NVIDIA Nemotron 3.5 Lightning (30B)',
    provider: 'NVIDIA',
    description: 'Otimizado para tomadas de decisão rápidas.'
  }
]

export const DEFAULT_NVIDIA_API_KEY =
  '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'

export interface CompletionResult {
  text: string
  reasoning?: string
  modelUsed: string
  modelName: string
  fallbackOccurred: boolean
  previousModel?: string
}

export class NvidiaModelPool {
  private apiKey: string
  private currentModelIndex: number = 0
  private models: AIModel[] = [...TOP_10_NVIDIA_MODELS]

  constructor(apiKey: string = DEFAULT_NVIDIA_API_KEY) {
    this.apiKey = apiKey
  }

  public setApiKey(key: string): void {
    if (key && key.trim()) {
      this.apiKey = key.trim()
    }
  }

  public getApiKey(): string {
    return this.apiKey
  }

  public getCurrentModel(): AIModel {
    return this.models[this.currentModelIndex] || this.models[0]
  }

  public getModels(): AIModel[] {
    return this.models
  }

  public setModelIndex(index: number): void {
    if (index >= 0 && index < this.models.length) {
      this.currentModelIndex = index
    }
  }

  public setCustomModel(modelId: string, name?: string): AIModel {
    const cleanId = modelId.trim()
    const existingIndex = this.models.findIndex((m) => m.id === cleanId)
    if (existingIndex !== -1) {
      this.currentModelIndex = existingIndex
      return this.models[existingIndex]
    }
    const newModel: AIModel = {
      id: cleanId,
      name: name || cleanId,
      provider: 'NVIDIA (Custom)',
      description: 'Modelo selecionado manualmente pelo usuário'
    }
    this.models.unshift(newModel)
    this.currentModelIndex = 0
    return newModel
  }

  /**
   * Executa a inferência com alternância automática (failover em cascata)
   * Se um modelo retornar erro (429 cota, 503, 504, 404 ou timeout),
   * pula para o próximo dos 10 melhores modelos e tenta novamente!
   */
  public async generateWithFallback(
    messages: Array<{ role: string; content: string }>,
    onFallback?: (fromModel: AIModel, toModel: AIModel, reason: string) => void
  ): Promise<CompletionResult> {
    const totalModels = this.models.length
    let attempts = 0
    let lastError: Error | null = null

    while (attempts < totalModels) {
      const activeModel = this.models[this.currentModelIndex]

      try {
        console.log(`[NvidiaPool] Chamando modelo [${activeModel.id}] (Tentativa ${attempts + 1}/${totalModels})...`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)

        // Tenta com response_format json_object para forçar separação limpa de raciocínio e JSON
        const requestPayload: any = {
          model: activeModel.id,
          messages,
          temperature: 0.1,
          max_tokens: 2048,
          response_format: { type: 'json_object' }
        }

        let response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload),
          signal: controller.signal
        })

        // Se o modelo específico não suportar response_format (HTTP 400), tenta sem o parâmetro
        if (response.status === 400) {
          delete requestPayload.response_format
          response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload),
            signal: controller.signal
          })
        }

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '')
          throw new Error(`HTTP ${response.status}: ${errorBody.slice(0, 150)}`)
        }

        const data = await response.json()
        const choice = data.choices?.[0]
        const rawContent = choice?.message?.content || ''
        const rawReasoning = choice?.message?.reasoning_content || ''

        // Se content veio preenchido, ele é o texto principal. Se veio vazio mas reasoning tem o JSON, usa o reasoning.
        const text = rawContent.trim() || rawReasoning.trim()

        if (!text) {
          throw new Error('Resposta vazia retornada pelo modelo.')
        }

        return {
          text,
          reasoning: rawReasoning.trim() || undefined,
          modelUsed: activeModel.id,
          modelName: activeModel.name,
          fallbackOccurred: attempts > 0
        }
      } catch (err: any) {
        lastError = err
        const fromModel = activeModel
        this.currentModelIndex = (this.currentModelIndex + 1) % totalModels
        const toModel = this.models[this.currentModelIndex]

        const reason = err.name === 'AbortError' ? 'Tempo de resposta excedido (Timeout)' : err.message || 'Cota esgotada / Erro de servidor'
        console.warn(`[NvidiaPool] Modelo [${fromModel.id}] falhou: ${reason}. Alternando para [${toModel.id}]...`)

        if (onFallback) {
          onFallback(fromModel, toModel, reason)
        }

        attempts++
      }
    }

    throw new Error(`Todos os 10 modelos de IA do pool da NVIDIA falharam. Último erro: ${lastError?.message}`)
  }
}

export const nvidiaPool = new NvidiaModelPool()
