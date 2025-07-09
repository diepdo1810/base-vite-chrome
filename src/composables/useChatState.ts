import { ref } from 'vue'

export function useChatState() {
  const messages = ref<Array<{ role: 'user' | 'assistant', content: string }>>([])
  const currentMessage = ref('')
  const history = ref<Array<{ role: 'user' | 'assistant', content: string }[]>>([])
  const future = ref<Array<{ role: 'user' | 'assistant', content: string }[]>>([])

  function setCurrentMessage(val: string) {
    currentMessage.value = val
  }

  function addMessage(message: { role: 'user' | 'assistant', content: string }) {
    // Lưu vào history để undo được
    history.value.push([...messages.value])
    messages.value.push(message)
    // Clear future khi có thao tác mới
    future.value = []
  }

  function clearMessages() {
    history.value.push([...messages.value])
    messages.value = []
    future.value = []
  }

  function undoMessage() {
    if (history.value.length > 0) {
      future.value.push([...messages.value])
      messages.value = history.value.pop() || []
    }
  }

  function redoMessage() {
    if (future.value.length > 0) {
      history.value.push([...messages.value])
      messages.value = future.value.pop() || []
    }
  }

  return {
    messages,
    currentMessage,
    setCurrentMessage,
    addMessage,
    clearMessages,
    undoMessage,
    redoMessage,
  }
}
