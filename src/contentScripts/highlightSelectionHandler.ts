// Lắng nghe sự kiện selection và hiển thị nút "Hỏi AI" gần vùng chọn

import { generateArticleSuggestions } from '~/services/aiService'

let askAiButton: HTMLButtonElement | null = null
let lastSelectionText = ''

function createAskAiButton() {
  if (askAiButton)
    return askAiButton
  askAiButton = document.createElement('button')
  askAiButton.textContent = 'Hỏi AI'
  askAiButton.style.position = 'absolute'
  askAiButton.style.zIndex = '2147483647'
  askAiButton.style.display = 'none'
  askAiButton.style.padding = '6px 12px'
  askAiButton.style.background = '#2563eb'
  askAiButton.style.color = '#fff'
  askAiButton.style.border = 'none'
  askAiButton.style.borderRadius = '6px'
  askAiButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
  askAiButton.style.cursor = 'pointer'
  askAiButton.style.fontSize = '14px'
  askAiButton.style.transition = 'opacity 0.2s'
  document.body.appendChild(askAiButton)
  return askAiButton
}

function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0)
    return null
  const range = selection.getRangeAt(0)
  if (range.collapsed)
    return null
  return range.getBoundingClientRect()
}

function showAskAiButton(rect: DOMRect) {
  const btn = createAskAiButton()
  btn.style.left = `${window.scrollX + rect.right + 8}px`
  btn.style.top = `${window.scrollY + rect.top - 4}px`
  btn.style.display = 'block'
  btn.style.opacity = '1'
}

function hideAskAiButton() {
  if (askAiButton) {
    askAiButton.style.display = 'none'
    askAiButton.style.opacity = '0'
  }
}

// Các mục đích hỏi AI
const PURPOSES = [
  { key: 'explain', label: 'Giải thích đoạn văn' },
  { key: 'summarize', label: 'Tóm tắt ý chính' },
  { key: 'analyze', label: 'Phân tích ý nghĩa' },
  { key: 'translate', label: 'Dịch sang tiếng Anh' },
  { key: 'question', label: 'Đặt câu hỏi liên quan' },
]

let askAiPopover: HTMLDivElement | null = null
let selectedPurpose = PURPOSES[0].key

// Các phong cách trả lời
const STYLES = [
  { key: 'teacher', label: 'Giáo viên' },
  { key: 'expert', label: 'Chuyên gia' },
  { key: 'friend', label: 'Bạn bè' },
]
let selectedStyle = STYLES[0].key

function createAskAiPopover() {
  if (askAiPopover) return askAiPopover
  askAiPopover = document.createElement('div')
  askAiPopover.style.position = 'absolute'
  askAiPopover.style.zIndex = '2147483647'
  askAiPopover.style.display = 'none'
  askAiPopover.style.background = '#fff'
  askAiPopover.style.border = '1px solid #2563eb'
  askAiPopover.style.borderRadius = '8px'
  askAiPopover.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)'
  askAiPopover.style.padding = '8px 0'
  askAiPopover.style.minWidth = '180px'
  askAiPopover.style.fontSize = '15px'
  askAiPopover.style.color = '#222'
  askAiPopover.style.userSelect = 'none'
  askAiPopover.style.transition = 'opacity 0.2s'
  askAiPopover.style.fontFamily = 'inherit'
  askAiPopover.tabIndex = -1

  // Mục đích hỏi AI
  PURPOSES.forEach(purpose => {
    const btn = document.createElement('button')
    btn.textContent = purpose.label
    btn.style.display = 'block'
    btn.style.width = '100%'
    btn.style.background = 'none'
    btn.style.border = 'none'
    btn.style.padding = '10px 18px'
    btn.style.textAlign = 'left'
    btn.style.cursor = 'pointer'
    btn.style.fontSize = '15px'
    btn.style.color = '#2563eb'
    btn.onmouseenter = () => { btn.style.background = '#f0f6ff' }
    btn.onmouseleave = () => { btn.style.background = 'none' }
    btn.onclick = () => handlePurposeClick(purpose.key)
    askAiPopover!.appendChild(btn)
  })

  // Divider
  const divider = document.createElement('div')
  divider.style.height = '1px'
  divider.style.background = '#e0e7ef'
  divider.style.margin = '8px 0'
  askAiPopover.appendChild(divider)

  // Chọn phong cách trả lời
  const styleLabel = document.createElement('div')
  styleLabel.textContent = 'Phong cách trả lời:'
  styleLabel.style.padding = '0 0 4px 18px'
  styleLabel.style.margin = '0'
  styleLabel.style.fontSize = '13px'
  styleLabel.style.color = '#666'
  askAiPopover.appendChild(styleLabel)

  const styleSelect = document.createElement('select')
  styleSelect.style.margin = '0 0 8px 0'
  styleSelect.style.fontSize = '15px'
  styleSelect.style.borderRadius = '4px'
  styleSelect.style.border = '1px solid #2563eb'
  styleSelect.style.padding = '2px 8px'
  styleSelect.style.background = '#f8fafc'
  styleSelect.style.color = '#2563eb'
  styleSelect.style.display = 'block'
  styleSelect.style.width = 'calc(100% - 36px)'
  styleSelect.style.marginLeft = '18px'
  STYLES.forEach(style => {
    const opt = document.createElement('option')
    opt.value = style.key
    opt.textContent = style.label
    styleSelect.appendChild(opt)
  })
  styleSelect.value = selectedStyle
  styleSelect.onchange = (e) => {
    selectedStyle = (e.target as HTMLSelectElement).value
  }
  askAiPopover.appendChild(styleSelect)

  document.body.appendChild(askAiPopover)
  return askAiPopover
}

function showAskAiPopover(rect: DOMRect) {
  const pop = createAskAiPopover()
  pop.style.left = `${window.scrollX + rect.right + 8}px`
  pop.style.top = `${window.scrollY + rect.top - 4}px`
  pop.style.display = 'block'
  pop.style.opacity = '1'
}

function hideAskAiPopover() {
  if (askAiPopover) {
    askAiPopover.style.display = 'none'
    askAiPopover.style.opacity = '0'
  }
}

function handlePurposeClick(purposeKey: string) {
  selectedPurpose = purposeKey
  if (!lastSelectionText) return hideAskAiPopover()
  let prompt = ''
  let stylePrompt = ''
  switch (selectedStyle) {
    case 'teacher':
      stylePrompt = 'Hãy trả lời như một giáo viên, giải thích dễ hiểu, có thể ví dụ minh họa.'
      break
    case 'expert':
      stylePrompt = 'Hãy trả lời như một chuyên gia, phân tích sâu, dùng thuật ngữ chuyên ngành nếu cần.'
      break
    case 'friend':
      stylePrompt = 'Hãy trả lời thân thiện, gần gũi như một người bạn.'
      break
    default:
      stylePrompt = ''
  }
  switch (purposeKey) {
    case 'explain':
      prompt = `${stylePrompt}\n\nHãy giải thích đoạn văn sau một cách dễ hiểu, ngắn gọn, súc tích.\n\nĐoạn văn:\n${lastSelectionText}`
      break
    case 'summarize':
      prompt = `${stylePrompt}\n\nHãy tóm tắt ý chính của đoạn văn sau bằng tiếng Việt, ngắn gọn, rõ ràng.\n\nĐoạn văn:\n${lastSelectionText}`
      break
    case 'analyze':
      prompt = `${stylePrompt}\n\nHãy phân tích ý nghĩa hoặc thông điệp của đoạn văn sau.\n\nĐoạn văn:\n${lastSelectionText}`
      break
    case 'translate':
      prompt = `${stylePrompt}\n\nHãy dịch đoạn văn sau sang tiếng Anh.\n\nĐoạn văn:\n${lastSelectionText}`
      break
    case 'question':
      prompt = `${stylePrompt}\n\nDựa trên đoạn văn sau, hãy đặt một số câu hỏi thảo luận hoặc câu hỏi mở rộng phù hợp.\n\nĐoạn văn:\n${lastSelectionText}`
      break
    default:
      prompt = lastSelectionText
  }
  chrome.runtime.sendMessage({
    action: 'ask-ai-selection',
    text: prompt,
    source: 'content-script',
  })
  hideAskAiPopover()
  hideAskAiButton()
}

// --- Gợi ý thông minh từ AI cho đoạn bôi đen ---
let smartSuggestionBtns: HTMLButtonElement[] = []
let isLoadingSmartSuggestions = false
let suggestTimeout: ReturnType<typeof setTimeout> | null = null

function handleSelectionMouseup() {
  if (suggestTimeout) clearTimeout(suggestTimeout)
  suggestTimeout = setTimeout(() => {
    const selection = window.getSelection()
    if (!selection) return
    const text = selection.toString().trim()
    if (text && text.length > 0 && text.length <= 1000) {
      fetchAndShowSmartSuggestions(text)
    }
  }, 200)
}

document.addEventListener('mouseup', handleSelectionMouseup)

// Sửa fetchAndShowSmartSuggestions dùng pollinations nội bộ
async function fetchAndShowSmartSuggestions(text: string) {
  smartSuggestionBtns.forEach(btn => btn.remove())
  smartSuggestionBtns = []
  if (askAiPopover) {
    let loadingDiv = askAiPopover.querySelector('.ai-suggest-loading') as HTMLDivElement
    if (!loadingDiv) {
      loadingDiv = document.createElement('div')
      loadingDiv.className = 'ai-suggest-loading'
      loadingDiv.style.color = '#2563eb'
      loadingDiv.style.fontSize = '13px'
      loadingDiv.style.padding = '4px 18px 0 18px'
      askAiPopover.appendChild(loadingDiv)
    }
    loadingDiv.textContent = 'Đang lấy gợi ý thông minh...'
  }
  isLoadingSmartSuggestions = true
  try {
    const suggestions = await generateArticleSuggestions(text, 3)
    if (askAiPopover) {
      const loadingDiv = askAiPopover.querySelector('.ai-suggest-loading')
      if (loadingDiv) loadingDiv.remove()
    }
    suggestions.forEach((sug, idx) => {
      const btn = document.createElement('button')
      btn.textContent = sug
      btn.style.display = 'block'
      btn.style.width = 'calc(100% - 36px)'
      btn.style.margin = '4px 0 0 18px'
      btn.style.background = '#f0f6ff'
      btn.style.border = '1px solid #2563eb'
      btn.style.borderRadius = '6px'
      btn.style.padding = '8px 10px'
      btn.style.textAlign = 'left'
      btn.style.cursor = 'pointer'
      btn.style.fontSize = '14px'
      btn.style.color = '#2563eb'
      btn.onclick = () => handleSmartSuggestionClick(sug)
      askAiPopover?.appendChild(btn)
      smartSuggestionBtns.push(btn)
    })
  } catch (e) {
    if (askAiPopover) {
      const loadingDiv = askAiPopover.querySelector('.ai-suggest-loading') as HTMLDivElement
      if (loadingDiv) loadingDiv.textContent = 'Không lấy được gợi ý thông minh.'
    }
  } finally {
    isLoadingSmartSuggestions = false
  }
}

function handleSmartSuggestionClick(suggestion: string) {
  // Gửi prompt: "Hãy trả lời/thảo luận về: ..." kèm phong cách
  let stylePrompt = ''
  switch (selectedStyle) {
    case 'teacher':
      stylePrompt = 'Hãy trả lời như một giáo viên, giải thích dễ hiểu, có thể ví dụ minh họa.'
      break
    case 'expert':
      stylePrompt = 'Hãy trả lời như một chuyên gia, phân tích sâu, dùng thuật ngữ chuyên ngành nếu cần.'
      break
    case 'friend':
      stylePrompt = 'Hãy trả lời thân thiện, gần gũi như một người bạn.'
      break
    default:
      stylePrompt = ''
  }
  const prompt = `${stylePrompt}\n\n${suggestion}`
  chrome.runtime.sendMessage({
    action: 'ask-ai-selection',
    text: prompt,
    source: 'content-script',
  })
  hideAskAiPopover()
  hideAskAiButton()
}

// Thay đổi: khi có selection, hiển thị popover thay vì nút
function handleSelectionChange() {
  const selection = window.getSelection()
  if (!selection)
    return hideAskAiPopover()
  const text = selection.toString().trim()
  if (text && text.length > 0 && text.length <= 1000) {
    lastSelectionText = text
    const rect = getSelectionRect()
    if (rect && rect.width > 0 && rect.height > 0) {
      showAskAiPopover(rect)
      return
    }
  }
  hideAskAiPopover()
}

document.addEventListener('selectionchange', handleSelectionChange)
document.addEventListener('scroll', hideAskAiPopover, true)
window.addEventListener('resize', hideAskAiPopover)
document.addEventListener('mousedown', (e) => {
  if (askAiPopover && !askAiPopover.contains(e.target as Node)) {
    hideAskAiPopover()
  }
})

// Xử lý sự kiện click nút để gửi message sang extension
function handleAskAiClick() {
  if (!lastSelectionText)
    return
  const prompt = `Hãy đọc và giải thích đoạn văn bản sau cho tôi một cách dễ hiểu, ngắn gọn, súc tích. Nếu có thể, hãy tóm tắt ý chính hoặc phân tích ý nghĩa của đoạn này.\n\nĐoạn văn:\n${lastSelectionText}`
  chrome.runtime.sendMessage({
    action: 'ask-ai-selection',
    text: prompt,
    source: 'content-script',
  })
  hideAskAiButton()
}

function attachClickHandler() {
  const btn = createAskAiButton()
  btn.removeEventListener('click', handleAskAiClick)
  btn.addEventListener('click', handleAskAiClick)
}

attachClickHandler()
