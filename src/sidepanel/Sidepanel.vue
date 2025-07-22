<script setup lang="ts">
import { onMounted } from 'vue'
import ChatInterface from '~/components/ChatInterface.vue'
import { useSidepanelChat } from '~/composables/useSidepanelChat'

const {
  currentUrl,
  isLoading,
  hasError,
  errorMessage,
  messages,
  currentMessage,
  selectedModel,
  availableModels,
  chatMode,
  sendMessage,
  handleKeyPress,
  addMessage,
  isCrawlerOn,
  setCrawlerOn,
} = useSidepanelChat()

// Đồng bộ trạng thái bật/tắt crawler từ ChatInterface
function handleUpdateCrawlerOn(val: boolean) {
  setCrawlerOn(val)
}

function handleSendMessage(isCrawler: boolean) {
  sendMessage(isCrawler)
}

function handleKeyPressWrapper(event: KeyboardEvent, isCrawler: boolean) {
  handleKeyPress(event, isCrawler)
}

onMounted(() => {
  chrome.runtime.onMessage.addListener((request: any, _sender: any, _sendResponse: (response?: any) => void) => {
    if (request.action === 'ask-ai-selection' && request.text) {
      currentMessage.value = request.text
      // Gửi prompt, không crawl bài báo
      sendMessage(false)
    }
  })
})
</script>

<template>
  <!-- Main Chat Interface -->
  <ChatInterface
    :messages="messages"
    :current-message="currentMessage"
    :is-loading="isLoading"
    :has-error="hasError"
    :error-message="errorMessage"
    :selected-model="selectedModel"
    :available-models="availableModels"
    :chat-mode="chatMode"
    :current-url="currentUrl"
    :is-crawler-on="isCrawlerOn"
    @update:current-message="val => currentMessage = val"
    @update:selected-model="val => selectedModel = val"
    @update:chat-mode="val => chatMode = val"
    @update:is-crawler-on="handleUpdateCrawlerOn"
    @send-message="handleSendMessage"
    @key-press="handleKeyPressWrapper"
    @add-message="addMessage"
  />
</template>
