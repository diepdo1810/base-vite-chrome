// Export all Pollinations utilities
export { default as pollinationsService } from '../services/pollinations'
export { usePollinations } from '../composables/usePollinations'
export { useArticleSuggestions } from '../composables/useArticleSuggestions'
export { default as pollinationsAxios } from '../helpers/axios'

// Export types
export type {
  PollinationsImageParams,
  PollinationsTextParams,
  PollinationsAudioParams,
  PollinationsResponse,
  GeneratedImage,
  GeneratedText,
  GeneratedAudio,
} from '../types/pollinations'

export type {
  ArticleSuggestion,
  ArticleAnalysisResult,
  CurrentPageInfo,
} from '../types/article-suggestions'

// Export data
export { defaultArticleSuggestions } from '../data/article-suggestions'

// Export article suggestions component
export { default as ArticleSuggestions } from '../components/ArticleSuggestions.vue'
