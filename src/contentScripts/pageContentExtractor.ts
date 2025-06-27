// Content script để hỗ trợ extract page content
// File này sẽ được inject vào các trang web

/**
 * Extract page content từ DOM
 */
function extractPageContent(): string {
  // Create temp container without scripts
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = document.body.innerHTML

  // Remove scripts from temp container
  tempContainer.querySelectorAll('script, style, nav, header, footer, aside').forEach(el => el.remove())

  // Try to find main content area
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
      if (content.length > 500) { // Ensure we have substantial content
        break
      }
    }
  }

  // Fallback to body if no content found
  if (!content || content.length < 500) {
    content = tempContainer.textContent || document.body.textContent || ''
  }

  // Clean up the content
  return content
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
    .trim()
    .substring(0, 10000) // Limit content length to avoid API limits
}

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request: any, _sender: any, sendResponse: any) => {
  if (request.action === 'getPageContent') {
    try {
      const content = extractPageContent()
      sendResponse({ content, success: true })
    }
    catch (error) {
      console.error('Error extracting page content:', error)
      sendResponse({
        content: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
    return true // Keep message channel open for async response
  }
})

// Also make extractPageContent available globally for executeScript
if (typeof window !== 'undefined') {
  (window as any).extractPageContent = extractPageContent
}
