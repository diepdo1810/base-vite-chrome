<script setup lang="ts">
import { onMounted } from 'vue'
import { storageDemo } from '~/logic/storage'
import { firecrawlScrapeHtml } from '~/logic/firecrawl'

const currentUrl = ref('Đang tải...')
const htmlContent = ref('')
const isLoading = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

function getCurrentTabUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      currentUrl.value = tabs[0].url || ''
    }
  })
}

function handleTabActivated() {
  getCurrentTabUrl()
}

function handleTabUpdated(tabId, changeInfo, tab) {
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
    htmlContent.value = await firecrawlScrapeHtml(currentUrl.value)
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
</script>

<template>
  <main class="w-full px-4 py-5 text-center text-gray-700">
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
</template>
