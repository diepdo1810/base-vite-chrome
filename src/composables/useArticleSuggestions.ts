import { computed, readonly, ref } from 'vue'
import type { ArticleAnalysisResult, ArticleSuggestion, CurrentPageInfo } from '../types/article-suggestions'
import { defaultArticleSuggestions } from '../data/article-suggestions'
import pollinationsService from '../services/pollinations'
import { extractPageContent } from '~/utils/extractContent'
import { generateArticleSuggestions } from '~/services/aiService'

export function useArticleSuggestions() {
  // State
  const isAnalyzing = ref(false)
  const currentPageInfo = ref<CurrentPageInfo | null>(null)
  const analysisError = ref<string | null>(null)
  const lastAnalysisResult = ref<string | null>(null)

  // State cho gợi ý thông minh
  const smartSuggestions = ref<string[]>([])
  const isLoadingSuggestions = ref(false)
  const suggestionsError = ref<string | null>(null)

  // Computed
  const suggestions = computed(() => defaultArticleSuggestions)

  const isPageInfoAvailable = computed(() =>
    currentPageInfo.value?.url && currentPageInfo.value?.title,
  )

  // Methods
  const setCurrentPageInfo = (pageInfo: CurrentPageInfo) => {
    currentPageInfo.value = pageInfo
    analysisError.value = null
  }

  const clearError = () => {
    analysisError.value = null
  }

  /**
   * Alternative method to get page content via message passing
   */
  const getPageContentViaMessage = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs: any[]) => {
        if (!tabs[0]?.id) {
          reject(new Error('No active tab found'))
          return
        }

        chrome.tabs.sendMessage(tabs[0].id, { action: 'getPageContent' }, (response: any) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message || 'Runtime error'))
          }
          else if (response?.content) {
            resolve(response.content)
          }
          else {
            reject(new Error('No content received from content script'))
          }
        })
      })
    })
  }
  /**
   * Crawl current page content
   */
  const crawlCurrentPage = async (): Promise<string> => {
    if (!currentPageInfo.value?.url) {
      throw new Error('No page URL available')
    }

    try {
      // Check if we're in extension context
      if (typeof chrome !== 'undefined' && chrome.scripting && chrome.tabs) {
        try {
          // Method 1: Try executeScript API
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
          const currentTab = tabs[0]

          if (!currentTab.id) {
            throw new Error('No active tab found')
          }

          const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            function: extractPageContent,
          })

          const content = results[0]?.result
          if (content && typeof content === 'string') {
            return content
          }

          throw new Error('executeScript returned empty content')
        }
        catch (scriptError) {
          console.warn('executeScript failed, trying message passing:', scriptError)

          // Method 2: Try message passing
          return await getPageContentViaMessage()
        }
      }
      else {
        // Direct DOM access - for content script or web page context
        return extractPageContent()
      }
    }
    catch (error) {
      console.error('Failed to crawl page:', error)

      // Fallback to direct DOM extraction
      try {
        return extractPageContent()
      }
      catch (fallbackError) {
        console.error('Fallback extraction also failed:', fallbackError)
        throw new Error('Failed to extract page content. Please make sure you are on a valid web page.')
      }
    }
  }
  /**
   * Analyze article with AI using suggestion
   */
  const analyzeArticleWithSuggestion = async (suggestion: ArticleSuggestion): Promise<ArticleAnalysisResult> => {
    if (!currentPageInfo.value) {
      return {
        success: false,
        error: 'No page information available',
      }
    }

    isAnalyzing.value = true
    analysisError.value = null

    try {
      // Get page content
      const pageContent = await crawlCurrentPage()

      // Prepare prompt for AI based on suggestion type
      const fullPrompt = `
Based on the following article content, ${suggestion.prompt}

Article Title: ${currentPageInfo.value.title}
Article URL: ${currentPageInfo.value.url}

Article Content:
${pageContent}

Please provide a helpful and comprehensive response in Vietnamese. Format your response clearly with proper structure and bullet points where appropriate.`

      // Use Pollinations AI to analyze
      const result = await pollinationsService.generateText({
        messages: [
          {
            role: 'system',
            content: 'You are GitHub Copilot, a helpful AI assistant that analyzes articles and provides insightful responses. Respond in Vietnamese and be thorough but concise. Use emojis and proper formatting to make responses engaging.',
          },
          {
            role: 'user',
            content: fullPrompt,
          },
        ],
        model: 'openai',
      })

      if (result.success && result.data) {
        lastAnalysisResult.value = result.data.content
        return {
          success: true,
          content: result.data.content,
        }
      }
      else {
        throw new Error(result.error || 'Failed to analyze article')
      }
    }
    catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      analysisError.value = errorMessage
      return {
        success: false,
        error: errorMessage,
      }
    }
    finally {
      isAnalyzing.value = false
    }
  }

  /**
   * Quick analysis with custom prompt
   */
  const analyzeWithCustomPrompt = async (customPrompt: string): Promise<ArticleAnalysisResult> => {
    const customSuggestion: ArticleSuggestion = {
      id: 'custom',
      title: 'Custom Analysis',
      prompt: customPrompt,
      icon: '🤔',
    }

    return analyzeArticleWithSuggestion(customSuggestion)
  }

  /**
   * Lấy gợi ý câu hỏi/thảo luận thông minh từ AI dựa trên nội dung bài báo
   */
  const fetchSmartSuggestions = async (num = 5) => {
    isLoadingSuggestions.value = true
    suggestionsError.value = null
    try {
      const pageContent = await crawlCurrentPage()
      const result = await generateArticleSuggestions(pageContent, num)
      smartSuggestions.value = result
    }
    catch (error) {
      suggestionsError.value = error instanceof Error ? error.message : 'Lỗi không xác định khi lấy gợi ý.'
      smartSuggestions.value = []
    }
    finally {
      isLoadingSuggestions.value = false
    }
  }

  return {
    // State
    isAnalyzing: readonly(isAnalyzing),
    currentPageInfo: readonly(currentPageInfo),
    analysisError: readonly(analysisError),
    lastAnalysisResult: readonly(lastAnalysisResult),
    smartSuggestions: readonly(smartSuggestions),
    isLoadingSuggestions: readonly(isLoadingSuggestions),
    suggestionsError: readonly(suggestionsError),

    // Computed
    suggestions: readonly(suggestions),
    isPageInfoAvailable: readonly(isPageInfoAvailable),

    // Methods
    setCurrentPageInfo,
    clearError,
    analyzeArticleWithSuggestion,
    analyzeWithCustomPrompt,
    fetchSmartSuggestions,
    crawlCurrentPage,
  }
}
