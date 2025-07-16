<script setup lang="ts">
import ChatInterface from '~/components/ChatInterface.vue'
import { useSidepanelChat } from '~/composables/useSidepanelChat'
import { onMounted, onBeforeUnmount } from 'vue'

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
} = useSidepanelChat()

onMounted(() => {
  chrome.runtime.onMessage.addListener((request: any, _sender: any, _sendResponse: (response?: any) => void) => {
    if (request.action === 'ask-ai-selection' && request.text) {
      currentMessage.value = request.text
      sendMessage()
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
    @update:current-message="val => currentMessage = val"
    @update:selected-model="val => selectedModel = val"
    @update:chat-mode="val => chatMode = val"
    @send-message="sendMessage"
    @key-press="handleKeyPress"
    @add-message="addMessage"
  />
</template>
