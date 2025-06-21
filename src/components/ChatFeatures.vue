<script setup>
// Define emits
const emit = defineEmits(['attach-context', 'chat-extensions', 'use-commands'])

// Feature data
const features = [
  {
    icon: '📎',
    text: 'or type # to attach context',
    action: 'attach-context',
  },
  {
    icon: '@',
    text: 'to chat with extensions',
    action: 'chat-extensions',
  },
  {
    icon: '⌨️',
    text: 'Type / to use commands',
    action: 'use-commands',
  },
]

// Handle feature click
function handleFeatureClick(action) {
  emit(action)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div
      v-for="feature in features"
      :key="feature.action"
      class="flex items-center gap-2 cursor-pointer px-2 py-1 rounded hover:bg-gray-800 transition-colors"
      @click="handleFeatureClick(feature.action)"
    >
      <span class="text-base">{{ feature.icon }}</span>
      <span class="text-sm text-gray-300">{{ feature.text }}</span>
    </div>
  </div>
</template>
