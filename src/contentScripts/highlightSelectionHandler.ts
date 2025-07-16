// Lắng nghe sự kiện selection và hiển thị nút "Hỏi AI" gần vùng chọn

let askAiButton: HTMLButtonElement | null = null;
let lastSelectionText = '';

function createAskAiButton() {
  if (askAiButton) return askAiButton;
  askAiButton = document.createElement('button');
  askAiButton.textContent = 'Hỏi AI';
  askAiButton.style.position = 'absolute';
  askAiButton.style.zIndex = '2147483647';
  askAiButton.style.display = 'none';
  askAiButton.style.padding = '6px 12px';
  askAiButton.style.background = '#2563eb';
  askAiButton.style.color = '#fff';
  askAiButton.style.border = 'none';
  askAiButton.style.borderRadius = '6px';
  askAiButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
  askAiButton.style.cursor = 'pointer';
  askAiButton.style.fontSize = '14px';
  askAiButton.style.transition = 'opacity 0.2s';
  document.body.appendChild(askAiButton);
  return askAiButton;
}

function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  const range = selection.getRangeAt(0);
  if (range.collapsed) return null;
  return range.getBoundingClientRect();
}

function showAskAiButton(rect: DOMRect) {
  const btn = createAskAiButton();
  btn.style.left = `${window.scrollX + rect.right + 8}px`;
  btn.style.top = `${window.scrollY + rect.top - 4}px`;
  btn.style.display = 'block';
  btn.style.opacity = '1';
}

function hideAskAiButton() {
  if (askAiButton) {
    askAiButton.style.display = 'none';
    askAiButton.style.opacity = '0';
  }
}

function handleSelectionChange() {
  const selection = window.getSelection();
  if (!selection) return hideAskAiButton();
  const text = selection.toString().trim();
  if (text && text.length > 0 && text.length <= 1000) {
    lastSelectionText = text;
    const rect = getSelectionRect();
    if (rect && rect.width > 0 && rect.height > 0) {
      showAskAiButton(rect);
      return;
    }
  }
  hideAskAiButton();
}

document.addEventListener('selectionchange', handleSelectionChange);
document.addEventListener('scroll', hideAskAiButton, true);
window.addEventListener('resize', hideAskAiButton);

document.addEventListener('mousedown', (e) => {
  if (askAiButton && !askAiButton.contains(e.target as Node)) {
    hideAskAiButton();
  }
});

// Xử lý sự kiện click nút để gửi message sang extension
function handleAskAiClick() {
  if (!lastSelectionText) return;
  const prompt = `Hãy đọc và giải thích đoạn văn bản sau cho tôi một cách dễ hiểu, ngắn gọn, súc tích. Nếu có thể, hãy tóm tắt ý chính hoặc phân tích ý nghĩa của đoạn này.\n\nĐoạn văn:\n${lastSelectionText}`;
  chrome.runtime.sendMessage({
    action: 'ask-ai-selection',
    text: prompt,
    source: 'content-script',
  });
  hideAskAiButton();
}

function attachClickHandler() {
  const btn = createAskAiButton();
  btn.removeEventListener('click', handleAskAiClick);
  btn.addEventListener('click', handleAskAiClick);
}

attachClickHandler(); 