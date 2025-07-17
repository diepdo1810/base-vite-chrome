import { onBeforeUnmount, onMounted, ref } from 'vue'
import { crawlUrlWithCache } from '~/services/webCrawlerService'
import { generateArticleAIResponse } from '~/services/aiService'
import { useChatState } from '~/composables/useChatState'

export function useSidepanelChat() {
  // State
  const currentUrl = ref('Đang tải...')
  const isLoading = ref(false)
  const hasError = ref(false)
  const errorMessage = ref('')
  const crawledContent = ref('')
  const selectedModel = ref('GPT-4.1')
  const availableModels = ['GPT-4.1', 'GPT-4o', 'Claude Sonnet 3.7', 'Claude Haiku']
  const chatMode = ref('Ask')
  const currentFileName = ref('Current Tab')
  const isCrawled = ref(false)
  function setCrawled(val: boolean) { isCrawled.value = val }

  const { messages, currentMessage, setCurrentMessage, addMessage, clearMessages, undoMessage, redoMessage } = useChatState()

  function getCurrentTabUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs: { url: string }[]) => {
      if (tabs && tabs[0]) {
        currentUrl.value = tabs[0].url || ''
        updateFileName()
      }
    })
  }

  function handleTabActivated() {
    getCurrentTabUrl()
  }

  function handleTabUpdated(_tabId: any, changeInfo: { url: string }, tab: { active: any }) {
    if (changeInfo.url && tab.active) {
      currentUrl.value = changeInfo.url
    }
  }

  onMounted(() => {
    getCurrentTabUrl()
    chrome.tabs.onActivated.addListener(handleTabActivated)
    chrome.tabs.onUpdated.addListener(handleTabUpdated)
  })

  onBeforeUnmount(() => {
    chrome.tabs.onActivated.removeListener(handleTabActivated)
    chrome.tabs.onUpdated.removeListener(handleTabUpdated)
  })

  async function sendMessage(forceSend = false, skipCrawl = false) {
    if (!currentMessage.value.trim() || isLoading.value)
      return
    if (!forceSend && !isCrawled.value) return false
    const messageText = currentMessage.value.trim()
    addMessage({ role: 'user', content: messageText })
    setCurrentMessage('')
    isLoading.value = true
    hasError.value = false
    try {
      let response = ''
      if (skipCrawl) {
        // Gửi prompt trực tiếp cho AI, không cần context bài báo
        const aiRes = await generateArticleAIResponse({
          messages: [
            { role: 'system', content: 'Bạn là một trợ lý AI giúp phân tích, giải thích, tóm tắt hoặc trả lời các câu hỏi về đoạn văn bản do người dùng cung cấp. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, có thể dùng emoji.' },
            { role: 'user', content: messageText }
          ],
          model: 'openai'
        })
        response = aiRes.data?.content || 'Không nhận được phản hồi từ AI.'
      } else {
        let articleContext = ''
        let articleAnalysis = ''
        if (currentUrl.value && currentUrl.value !== 'Đang tải...') {
          const results = await crawlUrlWithCache(currentUrl.value, {
            maxDepth: 1,
            maxPages: 1,
            extractArticleData: true,
            detectLanguage: true,
            extractKeywords: true,
          })
          if (results.length > 0) {
            const result = results[0]
            articleContext = result.content
            crawledContent.value = articleContext
            if (result.article) {
              const analysisParts = []
              analysisParts.push(`📰 Bài viết: "${result.article.title}"`)
              if (result.article.author)
                analysisParts.push(`✍️ Tác giả: ${result.article.author}`)
              if (result.article.readingTime)
                analysisParts.push(`⏱️ Thời gian đọc: ${result.article.readingTime} phút`)
              if (result.language) {
                const langName = result.language === 'vi' ? 'Tiếng Việt' : 'Tiếng Anh'
                analysisParts.push(`🌐 Ngôn ngữ: ${langName}`)
              }
              if (result.article.difficulty) {
                const difficultyMap = { easy: 'Dễ đọc', medium: 'Trung bình', hard: 'Khó đọc' }
                analysisParts.push(`📊 Độ khó: ${difficultyMap[result.article.difficulty]}`)
              }
              if (result.keywords && result.keywords.length > 0) {
                analysisParts.push(`🏷️ Từ khóa chính: ${result.keywords.slice(0, 5).join(', ')}`)
              }
              articleAnalysis = analysisParts.join('\n')
            }
          }
        }
        response = await generateCopilotResponse(messageText, articleContext, articleAnalysis)
      }
      addMessage({ role: 'assistant', content: response })
    }
    catch (error) {
      hasError.value = true
      errorMessage.value = error instanceof Error ? error.message : 'Lỗi không xác định'
      console.error('Lỗi khi gửi tin nhắn:', error)
    }
    finally {
      isLoading.value = false
    }
  }

  async function generateCopilotResponse(messageText: string, contextContent: string, articleAnalysis?: string): Promise<string> {
    // Luôn chờ dữ liệu crawl và AI trả lời, không trả về response mặc định nào
    if (contextContent) {
      try {
        // Prompt trực tiếp từ user, không dùng createArticlePrompt
        const prompt = `Bài báo:
${contextContent}

Câu hỏi của tôi: ${messageText}`
        const result = await generateArticleAIResponse({
          messages: [
            { role: 'system', content: 'Bạn là một trợ lý AI giúp phân tích bài báo và trả lời câu hỏi dựa trên nội dung bài báo. Trả lời bằng tiếng Việt, ngắn gọn, súc tích, có thể dùng emoji.' },
            { role: 'user', content: prompt },
          ],
          model: 'openai',
        })
        if (result.success && result.data) {
          return result.data.content
        }
        else {
          throw new Error(result.error || 'Failed to analyze article')
        }
      } catch (error) {
        console.error('Error calling Pollinations AI:', error)
        return `Xin lỗi, tôi gặp lỗi khi phân tích bài viết: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
    // Nếu không có dữ liệu crawl, fallback trả lời đơn giản
    let response = ''
    if (articleAnalysis) {
      response += `\n\n📋 **Phân tích bài viết hiện tại:**\n${articleAnalysis}`
    }
    response += `\n\nHiện tại tôi không lấy được nội dung bài báo. Bạn có thể hỏi lại sau hoặc thử tải lại trang.`
    return response
  }

  function detectArticleSuggestion(messageText: string): boolean {
    const suggestionKeywords = [
      'ask about this article',
      'summarize this article',
      'explain this article',
      'main takeaways',
      'generate questions about this article',
      'related topics should i explore',
      'provide a critical analysis',
      'tóm tắt bài viết',
      'giải thích bài viết',
      'phân tích bài viết',
    ]
    const lowerText = messageText.toLowerCase()
    return suggestionKeywords.some(keyword => lowerText.includes(keyword))
  }

  function createArticlePrompt(messageText: string, content: string, url: string): string {
    const lowerText = messageText.toLowerCase()
    let taskDescription = ''
    if (lowerText.includes('summarize') || lowerText.includes('tóm tắt')) {
      taskDescription = 'summarize this article in a clear and concise way'
    }
    else if (lowerText.includes('explain') || lowerText.includes('giải thích')) {
      taskDescription = 'explain this article in simple terms that anyone can understand'
    }
    else if (lowerText.includes('takeaways') || lowerText.includes('điểm chính')) {
      taskDescription = 'identify the main takeaways and key points from this article'
    }
    else if (lowerText.includes('questions') || lowerText.includes('câu hỏi')) {
      taskDescription = 'generate thoughtful questions about this article to help readers think deeper'
    }
    else if (lowerText.includes('related topics') || lowerText.includes('chủ đề liên quan')) {
      taskDescription = 'suggest related topics and areas for further exploration based on this article'
    }
    else if (lowerText.includes('critical analysis') || lowerText.includes('phân tích phê bình')) {
      taskDescription = 'provide a critical analysis of this article, including strengths, weaknesses, and different perspectives'
    }
    else if (lowerText.includes('ask about this article')) {
      taskDescription = 'provide an overview of what you can help with regarding this article and offer suggestions for different types of analysis'
    }
    else {
      taskDescription = 'help with the following request about this article'
    }
    return `\nBased on the following article, please ${taskDescription}.\n\nArticle URL: ${url}\nArticle Content:\n${content}\n\nUser Request: ${messageText}\n\nPlease provide a helpful and comprehensive response in Vietnamese. Use proper formatting with bullet points, emojis, and clear structure to make your response engaging and easy to read.`
  }

  function handleKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  function updateFileName() {
    try {
      if (currentUrl.value && currentUrl.value !== 'Đang tải...') {
        const url = new URL(currentUrl.value)
        currentFileName.value = url.pathname.split('/').pop() || url.hostname || 'Current Tab'
      }
    }
    catch {
      currentFileName.value = 'Current Tab'
    }
  }

  return {
    // State
    currentUrl,
    isLoading,
    hasError,
    errorMessage,
    crawledContent,
    messages,
    currentMessage,
    selectedModel,
    availableModels,
    chatMode,
    currentFileName,
    isCrawled,
    setCrawled,
    // Methods
    sendMessage,
    generateCopilotResponse,
    handleKeyPress,
    addMessage,
    updateFileName,
    clearMessages,
    undoMessage,
    redoMessage,
  }
}
