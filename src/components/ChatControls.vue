<!-- eslint-disable style/arrow-parens -->
<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  selectedModel: {
    type: String,
    required: true,
  },
  models: {
    type: Array,
    required: true,
  },
  isRecording: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:selectedModel', 'attach-context', 'toggle-recording', 'send'])

// Computed for v-model
const model = computed({
  get: () => props.selectedModel,
  set: (value) => emit('update:selectedModel', value),
})

// Control buttons data
const controlButtons = [
  {
    icon: '📎',
    title: 'Attach files',
    action: 'attach-context',
  },
  {
    icon: '⏎',
    title: 'Send message',
    action: 'send',
  },
]

// Handle control button click
function handleControlClick(action) {
  emit(action)
}
</script>

<template>
  <div class="flex justify-between items-center">
    <!-- Left Controls -->
    <div class="flex items-center gap-3">
      <!-- Ask Dropdown -->
      <div>
        <button class="bg-gray-700 border border-gray-600 text-gray-200 px-4 py-2 rounded-lg cursor-pointer text-sm font-medium hover:bg-gray-600 focus:outline-none focus:border-blue-500 transition-colors flex items-center gap-2">
          <span>Ask</span>
        </button>
      </div>

      <!-- Model Selector -->
      <div class="relative flex items-center">
        <select
          v-model="model"
          class="bg-gray-700 border border-gray-600 text-gray-200 pl-4 pr-10 py-2 rounded-lg cursor-pointer text-sm font-medium appearance-none hover:bg-gray-600 focus:outline-none focus:border-blue-500 transition-colors min-w-40"
        >
          <option v-for="modelOption in models" :key="modelOption" :value="modelOption">
            {{ modelOption }}
          </option>
        </select>
        <span class="absolute right-3 pointer-events-none text-xs text-gray-400">
          ▼
        </span>
      </div>
    </div>

    <!-- Right Controls -->
    <div class="flex gap-2">
      <button
        v-for="button in controlButtons"
        :key="button.action"
        :title="button.title"
        class="bg-transparent border-none text-gray-300 cursor-pointer p-2 rounded-lg text-lg hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition-colors"
        :class="[
          button.action === 'toggle-recording' && isRecording && 'bg-red-600 hover:bg-red-700 text-white',
        ]"
        @click="handleControlClick(button.action)"
      >
        {{ button.icon }}
      </button>
    </div>
  </div>
</template>
