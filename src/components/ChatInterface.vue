<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type { ArticleSuggestion } from '../types/article-suggestions'
import { useArticleSuggestions } from '../composables/useArticleSuggestions'
import ArticleSuggestions from './ArticleSuggestions.vue'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  messages: Message[]
  currentMessage: string
  isLoading: boolean
  hasError: boolean
  errorMessage: string
  selectedModel: string
  availableModels: string[]
  chatMode: string
  currentUrl: string
}

interface Emits {
  (e: 'update:currentMessage', value: string): void
  (e: 'update:selectedModel', value: string): void
  (e: 'update:chatMode', value: string): void
  (e: 'sendMessage'): void
  (e: 'keyPress', event: KeyboardEvent): void
  (e: 'addMessage', message: Message): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Initialize article suggestions
const {
  suggestions,
  isAnalyzing,
  isPageInfoAvailable,
  setCurrentPageInfo,
} = useArticleSuggestions()

// Set current page info when component mounts or URL changes
function updatePageInfo() {
  if (props.currentUrl) {
    setCurrentPageInfo({
      url: props.currentUrl,
      title: document.title || 'Current Page',
    })
  }
}

// Watch for URL changes
watchEffect(() => {
  updatePageInfo()
})

// Handle suggestion click
function handleSuggestionClick(suggestion: ArticleSuggestion) {
  // Fill the input with the suggestion text
  emit('update:currentMessage', suggestion.title)

  // Focus on the input
  setTimeout(() => {
    const textarea = document.querySelector('textarea[placeholder="Ask Copilot..."]') as HTMLTextAreaElement
    if (textarea) {
      textarea.focus()
      // Set cursor at the end
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, 50)
}

// Handle "Ask about this article" header click
function handleAskAboutArticleClick() {
  // Fill the input with the text
  emit('update:currentMessage', 'Ask about this article')

  // Focus on the input (optional)
  setTimeout(() => {
    const textarea = document.querySelector('textarea[placeholder="Ask Copilot..."]') as HTMLTextAreaElement
    if (textarea) {
      textarea.focus()
      // Set cursor at the end
      textarea.setSelectionRange(textarea.value.length, textarea.value.length)
    }
  }, 50)
}

// Show suggestions for empty state
const shouldShowEmptySuggestions = computed(() => {
  return props.messages.length === 0 && isPageInfoAvailable.value && !isAnalyzing.value
})

// Show suggestions at the end only if the last message is from assistant and we're not loading
const shouldShowSuggestions = computed(() => {
  if (!isPageInfoAvailable.value || isAnalyzing.value || props.isLoading) {
    return false
  }

  if (props.messages.length === 0) {
    return false // Empty state uses shouldShowEmptySuggestions
  }

  // Only show if last message is from assistant (completed response)
  const lastMessage = props.messages[props.messages.length - 1]
  return lastMessage && lastMessage.role === 'assistant'
})
</script>

<template>
  <!-- Main Chat Interface -->
  <div class="h-screen bg-white flex flex-col">
    <!-- Header -->
    <div class="bg-gray-50 border-b px-4 py-3 text-center font-medium text-gray-700 border-gray-200">
      CHAT
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col">
      <!-- Messages Area -->
      <div class="flex-1 overflow-y-auto p-6">
        <!-- Empty State / Welcome Screen -->
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center space-y-6">
          <!-- Copilot Icon -->
          <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
          </div>

          <!-- Title -->
          <h2 class="text-2xl font-medium text-gray-800">
            Ask Copilot
          </h2>

          <!-- Description -->
          <p class="text-gray-600 max-w-sm leading-relaxed">
            Copilot is powered by AI, so mistakes are possible.<br>
            Review output carefully before use.
          </p>

          <!-- Helper Text -->
          <div class="text-sm text-gray-500 space-y-2">
            <p>📎 or type # to attach context</p>
            <p>📡 @ to chat with extensions</p>
            <p class="ml-4">
              Type / to use commands
            </p>
          </div>

          <!-- Article Suggestions for Empty State -->
          <ArticleSuggestions
            v-if="shouldShowEmptySuggestions"
            :suggestions="suggestions"
            :is-analyzing="isAnalyzing"
            :is-visible="shouldShowEmptySuggestions"
            @suggestion-click="handleSuggestionClick"
            @header-click="handleAskAboutArticleClick"
          />
        </div>

        <!-- Chat Messages -->
        <div v-else class="space-y-4">
          <div v-for="(message, index) in messages" :key="index">
            <!-- User Message -->
            <div v-if="message.role === 'user'" class="flex justify-end">
              <div class="bg-blue-600 text-white rounded-lg px-4 py-3 max-w-xs">
                {{ message.content }}
              </div>
            </div>

            <!-- Assistant Message -->
            <div v-else>
              <!-- Header with name and button -->
              <div class="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                <div class="flex items-center gap-2">
                  <span class="font-medium text-gray-800">GitHub Copilot</span>
                  <span class="text-lg">🧠</span>
                </div>
              </div>

              <!-- Message content -->
              <div class="text-gray-800 whitespace-pre-line">
                {{ message.content }}
              </div>
            </div>
          </div>

          <!-- Article Suggestions -->
          <ArticleSuggestions
            v-if="shouldShowSuggestions"
            :suggestions="suggestions"
            :is-analyzing="isAnalyzing"
            :is-visible="shouldShowSuggestions"
            @suggestion-click="handleSuggestionClick"
            @header-click="handleAskAboutArticleClick"
          />

          <!-- Loading indicator -->
          <div v-if="isLoading">
            <div class="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
              <div class="flex items-center gap-2">
                <span class="font-medium text-gray-800">GitHub Copilot</span>
                <span class="text-lg">🧠</span>
              </div>
            </div>
            <div class="flex items-center gap-2 text-gray-500">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s" />
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s" />
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-gray-200 bg-white p-4 space-y-4">
        <!-- Context Display Row -->
        <div class="flex items-center gap-3">
          <span class="text-gray-600 text-sm">Add URL...</span>
          <div class="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded border">
            <span class="text-blue-600">✓</span>
            <span class="text-gray-700 text-sm font-medium">{{ currentUrl }}</span>
          </div>
        </div>

        <!-- Ask Copilot Row -->
        <div class="flex items-center justify-between">
          <span class="text-gray-600 text-sm">Ask Copilot</span>
        </div>

        <!-- Controls Row -->
        <div class="flex items-center gap-4">
          <!-- Ask/Agent Toggle -->
          <div class="flex bg-gray-100 rounded border">
            <button
              class="px-4 py-2 text-sm font-medium rounded-l transition-colors"
              :class="chatMode === 'Ask' ? 'bg-white shadow-sm border-r' : 'text-gray-600'"
              @click="$emit('update:chatMode', 'Ask')"
            >
              Ask
            </button>
            <button
              class="px-4 py-2 text-sm font-medium rounded-r transition-colors"
              :class="chatMode === 'Agent' ? 'bg-white shadow-sm border-l' : 'text-gray-600'"
              @click="$emit('update:chatMode', 'Agent')"
            >
              Agent
            </button>
          </div>

          <!-- Model Selection -->
          <div class="flex items-center gap-2">
            <select
              :value="selectedModel"
              class="text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:outline-none focus:border-blue-500 min-w-40"
              @change="$emit('update:selectedModel', ($event.target as HTMLSelectElement).value)"
            >
              <option v-for="model in availableModels" :key="model" :value="model">
                {{ model }}
              </option>
            </select>
          </div>
        </div>

        <!-- Input Row -->
        <div class="flex items-center gap-3">
          <span class="text-gray-400 text-lg">@</span>

          <textarea
            :value="currentMessage"
            placeholder="Ask Copilot..."
            class="flex-1 resize-none border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-blue-500 min-h-10 max-h-32"
            rows="1"
            @input="$emit('update:currentMessage', ($event.target as HTMLTextAreaElement).value)"
            @keydown="$emit('keyPress', $event)"
          />

          <button
            class="text-blue-600 text-xl hover:text-blue-700 transition-colors disabled:text-gray-400"
            :disabled="!currentMessage.trim() || isLoading"
            @click="$emit('sendMessage')"
          >
            ⏩
          </button>
        </div>
      </div>
    </div>

    <!-- Error Toast -->
    <div v-if="hasError" class="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
      Error: {{ errorMessage }}
    </div>
  </div>
</template>
