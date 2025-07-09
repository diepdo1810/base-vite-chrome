// Content script để hỗ trợ extract page content
// File này sẽ được inject vào các trang web

import { extractPageContent } from '~/helpers/extractContent'

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
