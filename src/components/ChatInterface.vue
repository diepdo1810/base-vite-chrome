<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import type { ArticleSuggestion } from '../types/article-suggestions'
import { useArticleSuggestions } from '../composables/useArticleSuggestions'
import ArticleSuggestions from './ArticleSuggestions.vue'
// @ts-ignore
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ linkify: true, breaks: true })

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
  <div class="h-screen w-full flex items-center justify-center bg-neutral-900">
    <div class="w-full max-w-xl h-[90vh] flex flex-col rounded-2xl shadow-2xl bg-neutral-800 border border-neutral-700 overflow-hidden">
      <!-- Header -->
      <div class="bg-neutral-800 border-b border-neutral-700 px-4 py-3 text-center font-semibold text-neutral-100 tracking-wide text-lg">
        AI CHAT
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Messages Area -->
        <div class="flex-1 min-h-0 flex flex-col">
          <!-- Empty State / Welcome Screen -->
          <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full text-center space-y-6">
            <!-- Copilot Icon -->
            <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
              <span class="i-ic:round-smart-toy text-white text-5xl" />
            </div>

            <!-- Title -->
            <h2 class="text-2xl font-semibold text-neutral-100">
              Ask AI
            </h2>

            <!-- Description -->
            <p class="text-neutral-300 max-w-sm leading-relaxed">
              AI is powered by advanced models, so mistakes are possible.<br>
              Review output carefully before use.
            </p>

            <!-- Helper Text -->
            <div class="text-sm text-neutral-400 space-y-2">
              <p>📎 or type # to attach context</p>
              <p>📡 @ to chat with extensions</p>
              <p class="ml-4">
                Type / to use commands
              </p>
            </div>
            <!-- ArticleSuggestions đã bị ẩn -->
          </div>

          <!-- Chat Messages -->
          <div v-else class="flex-1 min-h-0 flex flex-col gap-6 overflow-y-auto pr-1">
            <transition-group name="fade-chat" tag="div">
              <div v-for="(message, index) in messages" :key="index" class="w-full flex">
                <!-- User Message -->
                <div v-if="message.role === 'user'" class="flex w-full justify-end items-start gap-2">
                  <div class="max-w-[70%] bg-cyan-500 text-white rounded-2xl rounded-br-md px-5 py-3 shadow-lg text-base font-medium ml-auto animate-fade-in">
                    {{ message.content }}
                  </div>
                  <span class="i-ic:round-person text-cyan-400 text-2xl mt-1" />
                </div>
                <!-- Assistant Message -->
                <div v-else class="flex w-full justify-start items-start gap-2 mt-2">
                  <span class="i-ic:round-smart-toy text-cyan-400 text-2xl mt-1" />
                  <div class="max-w-[70%] bg-neutral-700 text-neutral-100 rounded-2xl rounded-bl-md px-5 py-3 shadow-lg text-base font-medium animate-fade-in prose prose-invert break-words" v-html="md.render(message.content)"></div>
                </div>
              </div>
            </transition-group>
            <!-- Loading indicator -->
            <div v-if="isLoading">
              <div class="flex items-center gap-2 mb-2 pb-2 border-b border-neutral-700">
                <span class="i-ic:round-smart-toy text-cyan-400 text-xl" />
                <span class="font-medium text-neutral-100">AI Assistant</span>
              </div>
              <div class="flex items-center gap-2 text-cyan-300">
                <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
                <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 0.1s" />
                <div class="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style="animation-delay: 0.2s" />
              </div>
            </div>
          </div>
        </div>

        <!-- Input Area -->
        <div class="border-t border-neutral-700 bg-neutral-800 p-4 space-y-4">
          <!-- Context Display Row -->
          <div class="flex items-center gap-3">
            <span class="text-neutral-400 text-sm">Add URL...</span>
            <div class="flex items-center gap-2 bg-neutral-700 px-3 py-1 rounded border border-neutral-600">
              <span class="text-cyan-400">✓</span>
              <span class="text-neutral-200 text-sm font-medium">{{ currentUrl }}</span>
            </div>
          </div>

          <!-- Ask AI Row -->
          <div class="flex items-center justify-between">
            <span class="text-neutral-400 text-sm">Ask AI</span>
          </div>

          <!-- Controls Row -->
          <div class="flex items-center gap-4">
            <!-- Ask/Agent Toggle -->
            <div class="flex bg-neutral-700 rounded border border-neutral-600">
              <button
                class="px-4 py-2 text-sm font-medium rounded-l transition-colors"
                :class="chatMode === 'Ask' ? 'bg-neutral-800 shadow-sm border-r border-neutral-600 text-cyan-400' : 'text-neutral-400'"
                @click="$emit('update:chatMode', 'Ask')"
              >
                Ask
              </button>
              <button
                class="px-4 py-2 text-sm font-medium rounded-r transition-colors"
                :class="chatMode === 'Agent' ? 'bg-neutral-800 shadow-sm border-l border-neutral-600 text-cyan-400' : 'text-neutral-400'"
                @click="$emit('update:chatMode', 'Agent')"
              >
                Agent
              </button>
            </div>

            <!-- Model Selection -->
            <div class="flex items-center gap-2">
              <select
                :value="selectedModel"
                class="text-sm border border-neutral-600 rounded px-3 py-2 bg-neutral-800 text-neutral-100 focus:outline-none focus:border-cyan-400 min-w-40"
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
            <span class="text-neutral-500 text-lg">@</span>

            <textarea
              :value="currentMessage"
              placeholder="Ask AI..."
              class="flex-1 resize-none border border-neutral-600 rounded-md px-3 py-2 text-sm bg-neutral-900 text-neutral-100 focus:outline-none focus:border-cyan-400 min-h-10 max-h-32 shadow-inner"
              rows="1"
              @input="$emit('update:currentMessage', ($event.target as HTMLTextAreaElement).value)"
              @keydown="$emit('keyPress', $event)"
            />

            <button
              class="text-cyan-400 text-2xl hover:text-cyan-300 transition-colors disabled:text-neutral-600"
              :disabled="!currentMessage.trim() || isLoading"
              @click="$emit('sendMessage')"
            >
              <span class="i-ic:round-send" />
            </button>
          </div>
        </div>
      </div>

      <!-- Error Toast -->
      <div v-if="hasError" class="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50">
        Error: {{ errorMessage }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-chat-enter-active, .fade-chat-leave-active {
  transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
}
.fade-chat-enter-from, .fade-chat-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
.fade-chat-enter-to, .fade-chat-leave-from {
  opacity: 1;
  transform: translateY(0);
}
.animate-fade-in {
  animation: fadeInUp 0.4s cubic-bezier(0.4,0,0.2,1);
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
