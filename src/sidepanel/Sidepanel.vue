<script setup lang="ts">
import { onMounted } from 'vue'
import { storageDemo } from '~/logic/storage'
// import { firecrawlScrapeHtml } from '~/logic/firecrawl'
import CopilotChat from '~/components/CopilotChat.vue'
import { WebCrawler } from '~/logic/webcrawler'

const currentUrl = ref('Đang tải...')
const htmlContent = ref('')
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')
const crawledContent = ref('')
const showCrawledContent = ref(false)
const htmlSelector = ref('')

function getCurrentTabUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs: { url: string }[]) => {
    if (tabs && tabs[0]) {
      currentUrl.value = tabs[0].url || ''
    }
  })
}

function handleTabActivated() {
  getCurrentTabUrl()
}

function handleTabUpdated(tabId: any, changeInfo: { url: string }, tab: { active: any }) {
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

async function readCurrentPage() {
  if (!currentUrl.value || currentUrl.value === 'Đang tải...') {
    // eslint-disable-next-line no-alert
    alert('Không thể đọc trang. URL chưa sẵn sàng')
    return
  }

  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    const crawler = new WebCrawler({ maxDepth: 1, maxPages: 1, selector: htmlSelector.value })
    const results = await crawler.crawl(currentUrl.value)

    if (results.length > 0) {
      htmlContent.value = results[0].content
    }
    else {
      throw new Error('No content found')
    }
  }
  catch (error) {
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'Lỗi không xác định'
    console.error('Lỗi khi scrape trang:', error)
  }
  finally {
    isLoading.value = false
  }
}

// Handler for CopilotChat's sendMessage
async function handleSendMessage(messageText: string) {
  // eslint-disable-next-line no-alert
  alert(`Đang gửi tin nhắn: ${messageText}`)
  isLoading.value = true
  hasError.value = false
  errorMessage.value = ''

  try {
    // Only crawl if we have a URL and it's not already loading
    if (currentUrl.value && currentUrl.value !== 'Đang tải...') {
      const crawler = new WebCrawler({ maxDepth: 1, maxPages: 1 })
      const results = await crawler.crawl(currentUrl.value)

      if (results.length > 0) {
        crawledContent.value = results[0].content
        // eslint-disable-next-line no-console
        console.log('WebCrawler processed content:', `${crawledContent.value.substring(0, 100)}...`)
        showCrawledContent.value = true
        // Here you would typically send both the message and the crawled content
        // to your AI service or backend
        // For now we'll just log it
        // eslint-disable-next-line no-console
        console.log(`Sending message "${messageText}" with context from URL: ${currentUrl.value}`)
      }
    }
  }
  catch (error) {
    hasError.value = true
    errorMessage.value = error instanceof Error ? error.message : 'Lỗi không xác định'
    console.error('Lỗi khi crawl trang:', error)
  }
  finally {
    isLoading.value = false
  }
}
function toggleCrawledContent() {
  showCrawledContent.value = !showCrawledContent.value
}
</script>

<template>
  <main v-if="false" class="w-full px-4 py-5 text-center text-gray-700">
    <Logo />
    <div>Sidepanel</div>

    <button
      class="btn mt-2"
      :disabled="isLoading || currentUrl === 'Đang tải...'"
      @click="readCurrentPage"
    >
      {{ isLoading ? 'LOADING...' : 'READ' }}
    </button>
    <div v-if="false" class="mt-2">
      <span class="opacity-50">Storage:</span> {{ storageDemo }}
    </div>
    <div class="mt-2">
      <span class="opacity-50">Current URL:</span> {{ currentUrl }}
    </div>

    <!-- Hiển thị lỗi nếu có -->
    <div v-if="hasError" class="mt-4 p-3 bg-red-100 text-red-700 rounded">
      <p class="font-bold">
        Lỗi khi đọc trang:
      </p>
      <p>{{ errorMessage }}</p>
    </div>

    <!-- Hiển thị nội dung HTML -->
    <div v-if="htmlContent" class="mt-4">
      <h3 class="text-lg font-medium mb-2">
        Nội dung trang:
      </h3>
      <div class="text-left border p-3 rounded max-h-96 overflow-auto">
        <div v-html="htmlContent" />
      </div>
    </div>
  </main>

  <main v-else class="w-full px-4 py-5 text-center text-gray-700">
    <!-- Thêm phần nhập selector -->
    <div class="bg-gray-800 p-2 mb-2 rounded-md">
      <div class="flex items-center gap-2">
        <input
          v-model="htmlSelector"
          type="text"
          placeholder="CSS selector (ví dụ: #main, .content)"
          class="w-full px-3 py-1 text-sm bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        >
      </div>
    </div>

    <CopilotChat :attached-context="currentUrl" :on-send-message="handleSendMessage" />

    <!-- Nút hiển thị/ẩn nội dung đã crawl -->
    <div v-if="crawledContent" class="fixed top-4 right-4">
      <button
        class="bg-blue-600 text-white px-3 py-1 rounded-full text-xs"
        @click="toggleCrawledContent"
      >
        {{ showCrawledContent ? 'Ẩn nội dung' : 'Hiện nội dung' }}
      </button>
    </div>

    <!-- Panel hiển thị crawledContent -->
    <div
      v-if="showCrawledContent && crawledContent"
      class="fixed top-12 right-4 w-80 max-h-96 bg-white shadow-lg border border-gray-200 rounded-md overflow-auto z-50"
    >
      <div class="p-3">
        <div class="flex justify-between items-center mb-2">
          <h3 class="font-medium">
            Nội dung đã crawl
          </h3>
          <button class="text-gray-500" @click="toggleCrawledContent">
            ✕
          </button>
        </div>
        <div class="text-sm text-left text-gray-700 whitespace-pre-wrap">
          {{ crawledContent }}
        </div>
      </div>
    </div>

    <!-- Optional loading indicator -->
    <div v-if="isLoading" class="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs">
      Crawling page...
    </div>

    <!-- Optional error display -->
    <div v-if="hasError" class="fixed bottom-4 right-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs">
      Error: {{ errorMessage }}
    </div>
  </main>
</template>
