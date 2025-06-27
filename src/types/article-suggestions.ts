// Types for article suggestions
export interface ArticleSuggestion {
  id: string
  title: string
  prompt: string
  icon: string
}

export interface ArticleAnalysisResult {
  success: boolean
  content?: string
  error?: string
}

export interface CurrentPageInfo {
  url: string
  title: string
  content?: string
}
