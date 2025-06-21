<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'send'])

// Computed for v-model
const message = computed({
  get: () => props.modelValue,
  // eslint-disable-next-line style/arrow-parens
  set: (value) => emit('update:modelValue', value),
})

// Handle key press
function handleKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    emit('send')
  }
}
</script>

<template>
  <div>
    <!-- Input Container -->
    <div class="relative">
      <textarea
        v-model="message"
        placeholder="Type your message here..."
        class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-gray-200 text-sm font-sans resize-none min-h-20 max-h-32 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-500 transition-colors"
        rows="3"
        @keypress="handleKeyPress"
      />
    </div>
  </div>
</template>
