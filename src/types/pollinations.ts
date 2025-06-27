// Pollinations API Types
export interface PollinationsImageParams {
  prompt: string
  model?: 'flux' | 'flux-realism' | 'flux-cablyai' | 'flux-anime' | 'flux-3d' | 'any-dark' | 'turbo'
  width?: number
  height?: number
  seed?: number
  enhance?: boolean
  safe?: boolean
  nologo?: boolean
}

export interface PollinationsTextParams {
  messages: Array<{
    role: 'system' | 'user' | 'assistant'
    content: string
  }>
  model?: 'openai' | 'mistral' | 'claude' | 'searchgpt'
  jsonMode?: boolean
  seed?: number
}

export interface PollinationsAudioParams {
  text: string
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  model?: 'openai-audio'
  speed?: number
}

export interface PollinationsResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface GeneratedImage {
  url: string
  prompt: string
  model: string
  width: number
  height: number
  seed?: number
}

export interface GeneratedText {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface GeneratedAudio {
  url: string
  text: string
  voice: string
  model: string
}
