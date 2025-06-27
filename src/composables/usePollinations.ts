import { computed, ref } from 'vue'
import pollinationsService from '../services/pollinations'
import type {
  GeneratedAudio,
  GeneratedImage,
  GeneratedText,
  PollinationsAudioParams,
  PollinationsImageParams,
  PollinationsTextParams,
} from '../types/pollinations'

export function usePollinations() {
  // Loading states
  const isGeneratingImage = ref(false)
  const isGeneratingText = ref(false)
  const isGeneratingAudio = ref(false)

  // Error states
  const imageError = ref<string | null>(null)
  const textError = ref<string | null>(null)
  const audioError = ref<string | null>(null)

  // Results
  const generatedImage = ref<GeneratedImage | null>(null)
  const generatedText = ref<GeneratedText | null>(null)
  const generatedAudio = ref<GeneratedAudio | null>(null)

  // Computed loading state
  const isLoading = computed(() =>
    isGeneratingImage.value || isGeneratingText.value || isGeneratingAudio.value,
  )

  // Generate Image
  const generateImage = async (params: PollinationsImageParams) => {
    isGeneratingImage.value = true
    imageError.value = null
    generatedImage.value = null

    try {
      pollinationsService.validateImageParams(params)
      const result = await pollinationsService.generateImage(params)

      if (result.success && result.data) {
        generatedImage.value = result.data
        return result.data
      }
      else {
        imageError.value = result.error || 'Failed to generate image'
        throw new Error(result.error)
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      imageError.value = errorMessage
      throw error
    }
    finally {
      isGeneratingImage.value = false
    }
  }

  // Generate Text
  const generateText = async (params: PollinationsTextParams) => {
    isGeneratingText.value = true
    textError.value = null
    generatedText.value = null

    try {
      const result = await pollinationsService.generateText(params)

      if (result.success && result.data) {
        generatedText.value = result.data
        return result.data
      }
      else {
        textError.value = result.error || 'Failed to generate text'
        throw new Error(result.error)
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      textError.value = errorMessage
      throw error
    }
    finally {
      isGeneratingText.value = false
    }
  }

  // Generate Audio
  const generateAudio = async (params: PollinationsAudioParams) => {
    isGeneratingAudio.value = true
    audioError.value = null
    generatedAudio.value = null

    try {
      const result = await pollinationsService.generateAudio(params)

      if (result.success && result.data) {
        generatedAudio.value = result.data
        return result.data
      }
      else {
        audioError.value = result.error || 'Failed to generate audio'
        throw new Error(result.error)
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      audioError.value = errorMessage
      throw error
    }
    finally {
      isGeneratingAudio.value = false
    }
  }

  // Simple text generation
  const simpleTextGeneration = async (prompt: string, model?: string) => {
    isGeneratingText.value = true
    textError.value = null

    try {
      const result = await pollinationsService.simpleTextGeneration(prompt, model)

      if (result.success && result.data) {
        return result.data
      }
      else {
        textError.value = result.error || 'Failed to generate text'
        throw new Error(result.error)
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      textError.value = errorMessage
      throw error
    }
    finally {
      isGeneratingText.value = false
    }
  }

  // Clear errors
  const clearErrors = () => {
    imageError.value = null
    textError.value = null
    audioError.value = null
  }

  // Clear results
  const clearResults = () => {
    generatedImage.value = null
    generatedText.value = null
    generatedAudio.value = null
  }

  // Get available models
  const availableModels = pollinationsService.getAvailableModels()

  return {
    // Loading states
    isGeneratingImage: readonly(isGeneratingImage),
    isGeneratingText: readonly(isGeneratingText),
    isGeneratingAudio: readonly(isGeneratingAudio),
    isLoading: readonly(isLoading),

    // Error states
    imageError: readonly(imageError),
    textError: readonly(textError),
    audioError: readonly(audioError),

    // Results
    generatedImage: readonly(generatedImage),
    generatedText: readonly(generatedText),
    generatedAudio: readonly(generatedAudio),

    // Methods
    generateImage,
    generateText,
    generateAudio,
    simpleTextGeneration,
    clearErrors,
    clearResults,

    // Available models
    availableModels,
  }
}
