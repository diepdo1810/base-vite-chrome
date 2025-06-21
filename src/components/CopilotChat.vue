<script setup>
import { onMounted, ref } from 'vue'
import ChatHeader from './ChatHeader.vue'
import ChatLogo from './ChatLogo.vue'
import ChatFeatures from './ChatFeatures.vue'
import ChatInput from './ChatInput.vue'
import ChatControls from './ChatControls.vue'

// Reactive state
const message = ref('')
const selectedModel = ref('Claude Sonnet 3.7')
const isRecording = ref(false)
// eslint-disable-next-line unused-imports/no-unused-vars
const attachedContext = ref('Sidepanel.vue')

// Available models
const models = [
  'Claude Sonnet 3.7',
  'Claude Sonnet 4.0',
  'GPT-4',
  'GPT-3.5 Turbo',
]

// Functions
function sendMessage() {
  if (message.value.trim()) {
    // eslint-disable-next-line no-console
    console.log('Sending message:', message.value)
    // TODO: Implement message sending logic
    message.value = ''
  }
}

function attachContext() {
// eslint-disable-next-line no-console
  console.log('Attaching context...')
  // TODO: Implement context attachment logic
}

function chatWithExtensions() {
// eslint-disable-next-line no-console
  console.log('Chat with extensions...')
  // TODO: Implement extensions chat logic
}

function useCommands() {
// eslint-disable-next-line no-console
  console.log('Using commands...')
  // TODO: Implement commands logic
}

function toggleRecording() {
  isRecording.value = !isRecording.value
  // eslint-disable-next-line no-console
  console.log('Recording:', isRecording.value)
  // TODO: Implement voice recording logic
}

// Lifecycle hooks
onMounted(() => {
// eslint-disable-next-line no-console
  console.log('Copilot Chat component mounted')
})
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-900 text-gray-300 font-sans">
    <!-- Header -->
    <ChatHeader />

    <!-- Main Content -->
    <div class="flex-1 flex flex-col justify-center items-center px-8 py-8 text-center">
      <ChatLogo />
      <ChatFeatures
        @attach-context="attachContext"
        @chat-extensions="chatWithExtensions"
        @use-commands="useCommands"
      />
    </div>

    <!-- Bottom Section -->
    <div class="bg-gray-850 border-t border-gray-700">
      <!-- File Context Bar -->
      <div class="flex items-center gap-2 px-4 py-2 text-sm bg-gray-800 border-b border-gray-700">
        <span class="text-base">📎</span>
        <span class="text-gray-400">Add URL...</span>
        <span class="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
          ✓ vnexpress.net/rac-ai-4899617.html
        </span>
      </div>

      <!-- Input Section -->
      <div class="px-4 py-3">
        <ChatInput
          v-model="message"
          @send="sendMessage"
        />
      </div>

      <!-- Controls -->
      <div class="px-4 pb-4">
        <ChatControls
          v-model:selected-model="selectedModel"
          :models="models"
          :is-recording="isRecording"
          @attach-context="attachContext"
          @toggle-recording="toggleRecording"
          @send="sendMessage"
        />
      </div>
    </div>
  </div>
</template>
