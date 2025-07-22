import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { generateArticleAIResponse } from '~/services/aiService'
import { useChatState } from '~/composables/useChatState'
import { useWebExtensionStorage } from '~/composables/useWebExtensionStorage'
import { extractArticleWithDiffbot } from '~/utils/webcrawler'

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
  const isCrawlerOn = ref(false)
  function setCrawlerOn(val: boolean) { isCrawlerOn.value = val }

  // Lưu dữ liệu crawl vào storage theo url
  const isValidUrl = computed(() => {
    try {
      const url = new URL(currentUrl.value)
      return !!url
    }
    catch {
      return false
    }
  })

  const crawlStorageKey = computed(() => isValidUrl.value ? `crawl-content:${currentUrl.value}` : '')
  const { data: crawlStorage, dataReady: crawlStorageReady } = useWebExtensionStorage<string>(crawlStorageKey.value, '')

  // Xóa dữ liệu crawl khi url thay đổi (nếu crawler bật)
  watch(currentUrl, (newUrl, oldUrl) => {
    if (isCrawlerOn.value && oldUrl && oldUrl !== 'Đang tải...') {
      const oldKey = `crawl-content:${oldUrl}`
      chrome.storage.local.remove(oldKey)
    }
    // Reset lại crawlStorage khi đổi URL để không dùng lại nội dung cũ
    if (isValidUrl.value) {
      crawlStorage.value = ''
    }
  })

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

  async function sendMessage(isCrawler: boolean) {
    if (!currentMessage.value.trim() || isLoading.value)
      return
    const messageText = currentMessage.value.trim()
    addMessage({ role: 'user', content: messageText })
    setCurrentMessage('')
    isLoading.value = true
    hasError.value = false
    try {
      let response = ''
      if (!isCrawler) {
        // Gửi prompt trực tiếp cho AI, không cần context bài báo
        const aiRes = await generateArticleAIResponse({
          messages: [
            { role: 'system', content: 'Bạn là một trợ lý AI giúp phân tích, giải thích, tóm tắt hoặc trả lời các câu hỏi về đoạn văn bản do người dùng cung cấp. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, có thể dùng emoji.' },
            { role: 'user', content: messageText },
          ],
          model: 'openai',
        })
        response = aiRes.data?.content || 'Không nhận được phản hồi từ AI.'
      }
      else {
        let articleContext = ''
        let articleAnalysis = ''
        if (currentUrl.value && currentUrl.value !== 'Đang tải...') {
          // Nếu đã có dữ liệu crawl trong storage thì dùng luôn
          await crawlStorageReady
          if (isValidUrl.value && crawlStorage.value) {
            articleContext = crawlStorage.value
          }
          else if (isValidUrl.value) {
            // Sử dụng Diffbot để extract nội dung
            const diffbotResult = await extractArticleWithDiffbot(currentUrl.value)
            articleContext = diffbotResult.text
            crawledContent.value = articleContext
            crawlStorage.value = articleContext // Lưu vào storage

            // Tạo phần phân tích đơn giản từ kết quả Diffbot
            const analysisParts = []
            if (diffbotResult.title)
              analysisParts.push(`📰 Bài viết: "${diffbotResult.title}"`)

            if (diffbotResult.date)
              analysisParts.push(`🗓️ Ngày đăng: ${diffbotResult.date}`)

            articleAnalysis = analysisParts.join('\n')
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
        const prompt = `Bài báo:\n${contextContent}\n\nCâu hỏi của tôi: ${messageText}`
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
      }
      catch (error) {
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

  function handleKeyPress(event: KeyboardEvent, isCrawler: boolean) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(isCrawler)
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
    isCrawlerOn,
    setCrawlerOn,
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
