<script setup lang="ts">
import type { ArticleSuggestion } from '../types/article-suggestions'

interface Props {
  suggestions: readonly ArticleSuggestion[]
  isAnalyzing: boolean
  isVisible: boolean
}

interface Emits {
  (e: 'suggestionClick', suggestion: ArticleSuggestion): void
  (e: 'headerClick'): void
}

defineProps<Props>()
defineEmits<Emits>()
</script>

<template>
  <div
    v-if="isVisible"
    style="border: 1px solid #e5e7eb; border-radius: 6px; background-color: #f9fafb; margin-top: 16px; overflow: hidden;"
  >
    <!-- Header -->
    <div
      style="padding: 12px 16px; background-color: #f3f4f6; border-bottom: 1px solid #e5e7eb; cursor: pointer;"
      @click="$emit('headerClick')"
    >
      <span style="font-size: 14px; font-weight: 500; color: #374151;">Ask about this article</span>
    </div>

    <!-- Suggestions List -->
    <div style="padding: 8px;">
      <button
        v-for="suggestion in suggestions"
        :key="suggestion.id"
        :disabled="isAnalyzing"
        type="button"
        style="display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px; border: none; background-color: transparent; border-radius: 4px; cursor: pointer; transition: all 0.2s ease; text-align: left; position: relative;"
        :style="{ opacity: isAnalyzing ? '0.6' : '1', cursor: isAnalyzing ? 'not-allowed' : 'pointer' }"
        @click="$emit('suggestionClick', suggestion)"
        @mouseover="(e) => { if (!isAnalyzing && e.target) (e.target as HTMLElement).style.backgroundColor = '#e5e7eb' }"
        @mouseleave="(e) => { if (e.target) (e.target as HTMLElement).style.backgroundColor = 'transparent' }"
      >
        <span style="font-size: 16px; flex-shrink: 0; width: 20px; text-align: center;">{{ suggestion.icon }}</span>
        <span style="flex: 1; font-size: 14px; color: #374151; line-height: 1.4;">{{ suggestion.title }}</span>
        <span v-if="isAnalyzing" style="flex-shrink: 0; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 12px; height: 12px; border: 2px solid #e5e7eb; border-top: 2px solid #3b82f6; border-radius: 50%; animation: spin 1s linear infinite;" />
        </span>
      </button>
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
