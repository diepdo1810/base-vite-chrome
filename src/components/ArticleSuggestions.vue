<script setup lang="ts">
import type { ArticleSuggestion } from '../types/article-suggestions'

interface Props {
  suggestions: readonly ArticleSuggestion[]
  isAnalyzing: boolean
  isVisible: boolean
  smartSuggestions?: readonly string[]
  isLoadingSuggestions?: boolean
  suggestionsError?: string | null
}

interface Emits {
  (e: 'suggestionClick', suggestion: ArticleSuggestion): void
  (e: 'headerClick'): void
  (e: 'smartSuggestionClick', suggestion: string): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div
    v-if="isVisible"
    class="mt-4 rounded-xl border border-neutral-700 bg-neutral-800 overflow-hidden shadow-lg"
  >
    <!-- Header -->
    <div
      class="px-5 py-3 bg-neutral-700 border-b border-neutral-600 cursor-pointer text-neutral-200 text-base font-semibold tracking-wide hover:bg-neutral-600 transition-colors"
      @click="$emit('headerClick')"
    >
      <span class="i-ic:outline-article mr-2 text-cyan-400 text-lg align-middle" />
      Hỏi về bài báo này
    </div>

    <!-- Suggestions List (mặc định) -->
    <div class="p-3 flex flex-col gap-2">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        :disabled="isAnalyzing"
        type="button"
        class="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-transparent bg-neutral-900 text-neutral-100 hover:bg-cyan-950 hover:border-cyan-400 transition-all duration-150 text-left shadow group disabled:opacity-60 disabled:cursor-not-allowed"
        @click="$emit('suggestionClick', suggestion)"
      >
        <span class="text-xl flex-shrink-0 text-cyan-400">{{ suggestion.icon }}</span>
        <span class="flex-1 text-base leading-snug">{{ suggestion.title }}</span>
        <span v-if="isAnalyzing" class="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          <span class="i-svg-spinners:3-dots-bounce text-cyan-400 text-lg animate-spin" />
        </span>
      </button>

      <!-- Smart Suggestions (AI) -->
      <template v-if="smartSuggestions && smartSuggestions.length">
        <div class="mt-2 mb-1 text-cyan-400 text-sm font-semibold">
          Gợi ý thông minh từ AI:
        </div>
        <button
          v-for="(sug, idx) in smartSuggestions"
          :key="`smart-${idx}`"
          :disabled="isLoadingSuggestions"
          type="button"
          class="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-transparent bg-neutral-900 text-neutral-100 hover:bg-cyan-950 hover:border-cyan-400 transition-all duration-150 text-left shadow group disabled:opacity-60 disabled:cursor-not-allowed"
          @click="$emit('smartSuggestionClick', sug)"
        >
          <span class="i-mdi:owl text-yellow-400 text-xl flex-shrink-0" />
          <span class="flex-1 text-base leading-snug">{{ sug }}</span>
        </button>
      </template>
      <div v-if="isLoadingSuggestions" class="text-cyan-400 text-sm mt-2">
        Đang lấy gợi ý thông minh...
      </div>
      <div v-if="suggestionsError" class="text-red-400 text-sm mt-2">
        {{ suggestionsError }}
      </div>
    </div>
  </div>
</template>

<style>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>

<style scoped>
/* Additional custom styles if needed */
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
