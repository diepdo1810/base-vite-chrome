// Helper để extract nội dung chính từ DOM (dùng chung cho content script, composable, v.v.)

export function extractPageContent(): string {
  // Tạo temp container để loại bỏ các phần không cần thiết
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = document.body.innerHTML

  // Loại bỏ script, style, nav, header, footer, aside
  tempContainer.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove())

  // Các selector ưu tiên cho nội dung chính
  const contentSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.content',
    '.post-content',
    '.article-content',
    '.entry-content',
    '#content',
    '.main-content',
  ]

  let content = ''
  for (const selector of contentSelectors) {
    const element = tempContainer.querySelector(selector) || document.querySelector(selector)
    if (element) {
      content = element.textContent || ''
      if (content.length > 500) {
        break
      }
    }
  }

  // Fallback nếu không tìm thấy nội dung đủ lớn
  if (!content || content.length < 500) {
    content = tempContainer.textContent || document.body.textContent || ''
  }

  // Làm sạch nội dung
  return content
    .replace(/\s+/g, ' ')
    .replace(/\n+/g, '\n')
    .trim()
    .substring(0, 10000)
}
