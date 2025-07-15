import axios from 'axios'
import pollinationsAxios from '../utils/axios'
import type {
  GeneratedAudio,
  GeneratedImage,
  GeneratedText,
  PollinationsAudioParams,
  PollinationsImageParams,
  PollinationsResponse,
  PollinationsTextParams,
} from '../types/pollinations'

class PollinationsService {
  private readonly BASE_URL = 'https://pollinations.ai'
  private readonly TEXT_URL = 'https://text.pollinations.ai'

  /**
   * Generate an image from text prompt
   */
  async generateImage(params: PollinationsImageParams): Promise<PollinationsResponse<GeneratedImage>> {
    try {
      const {
        prompt,
        model = 'flux',
        width = 1024,
        height = 1024,
        seed,
        enhance = false,
        safe = true,
        nologo = true,
      } = params

      // Build URL parameters
      const urlParams = new URLSearchParams({
        width: width.toString(),
        height: height.toString(),
        model,
        enhance: enhance.toString(),
        safe: safe.toString(),
        nologo: nologo.toString(),
      })

      if (seed !== undefined) {
        urlParams.append('seed', seed.toString())
      }

      // Encode prompt for URL
      const encodedPrompt = encodeURIComponent(prompt)
      const imageUrl = `${this.BASE_URL}/p/${encodedPrompt}?${urlParams.toString()}`

      // Test if image is accessible
      const response = await axios.head(imageUrl, { timeout: 10000 })

      if (response.status === 200) {
        return {
          success: true,
          data: {
            url: imageUrl,
            prompt,
            model,
            width,
            height,
            seed,
          },
        }
      }

      throw new Error('Image generation failed')
    }
    catch (error) {
      console.error('Pollinations Image Generation Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Generate text using AI models
   */
  async generateText(params: PollinationsTextParams): Promise<PollinationsResponse<GeneratedText>> {
    try {
      const {
        messages,
        model = 'openai',
        jsonMode = false,
        seed,
      } = params

      const requestBody = {
        messages,
        model,
        jsonMode,
        seed,
      }

      const response = await pollinationsAxios.post(this.TEXT_URL, requestBody, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      })

      return {
        success: true,
        data: {
          content: response.data,
          model,
        },
      }
    }
    catch (error) {
      console.error('Pollinations Text Generation Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Generate audio from text
   */
  async generateAudio(params: PollinationsAudioParams): Promise<PollinationsResponse<GeneratedAudio>> {
    try {
      const {
        text,
        voice = 'nova',
        model = 'openai-audio',
        speed = 1.0,
      } = params

      const urlParams = new URLSearchParams({
        model,
        voice,
        speed: speed.toString(),
      })

      const encodedText = encodeURIComponent(text)
      const audioUrl = `${this.TEXT_URL}/${encodedText}?${urlParams.toString()}`

      // Test if audio is accessible
      const response = await axios.head(audioUrl, { timeout: 10000 })

      if (response.status === 200) {
        return {
          success: true,
          data: {
            url: audioUrl,
            text,
            voice,
            model,
          },
        }
      }

      throw new Error('Audio generation failed')
    }
    catch (error) {
      console.error('Pollinations Audio Generation Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Simple text generation for quick prompts
   */
  async simpleTextGeneration(prompt: string, model?: string): Promise<PollinationsResponse<string>> {
    try {
      const urlParams = new URLSearchParams()
      if (model) {
        urlParams.append('model', model)
      }

      const encodedPrompt = encodeURIComponent(prompt)
      const url = `${this.TEXT_URL}/${encodedPrompt}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`

      const response = await pollinationsAxios.get(url, { timeout: 30000 })

      return {
        success: true,
        data: response.data,
      }
    }
    catch (error) {
      console.error('Pollinations Simple Text Generation Error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }
    }
  }

  /**
   * Get available models
   */
  getAvailableModels() {
    return {
      image: ['flux', 'flux-realism', 'flux-cablyai', 'flux-anime', 'flux-3d', 'any-dark', 'turbo'],
      text: ['openai', 'mistral', 'claude', 'searchgpt'],
      audio: ['openai-audio'],
      voices: ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
    }
  }

  /**
   * Validate image parameters
   */
  validateImageParams(params: PollinationsImageParams): boolean {
    const { prompt, width, height, model } = params
    const availableModels = this.getAvailableModels().image

    if (!prompt || prompt.trim().length === 0) {
      throw new Error('Prompt is required')
    }

    if (width && (width < 1 || width > 2048)) {
      throw new Error('Width must be between 1 and 2048')
    }

    if (height && (height < 1 || height > 2048)) {
      throw new Error('Height must be between 1 and 2048')
    }

    if (model && !availableModels.includes(model)) {
      throw new Error(`Model must be one of: ${availableModels.join(', ')}`)
    }

    return true
  }
}

// Export singleton instance
export const pollinationsService = new PollinationsService()
export default pollinationsService
