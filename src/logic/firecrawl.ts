import FirecrawlApp from '@mendable/firecrawl-js'
import type { ScrapeResponse } from '@mendable/firecrawl-js'

export async function firecrawlScrape(url: string): Promise<ScrapeResponse> {
  const firecrawl = new FirecrawlApp({
    apiKey: import.meta.env.VITE_FIRECRAWL_API_KEY,
  })

  try {
    const scrapeResult = await firecrawl.scrapeUrl(url, { formats: ['markdown', 'html'], agent: {
      model: 'FIRE-1',
      prompt: 'Giúp tôi tóm tắt nội dung của trang web này. Trả về kết quả dưới dạng markdown và html.',
    } }) as ScrapeResponse
    return scrapeResult
  }
  catch (error) {
    console.error('Firecrawl scrape error:', error)
    throw error
  }
}

export async function firecrawlScrapeMarkdown(url: string): Promise<string> {
  const scrapeResult = await firecrawlScrape(url)
  return scrapeResult.markdown || ''
}

export async function firecrawlScrapeHtml(url: string): Promise<string> {
  const scrapeResult = await firecrawlScrape(url)
  return scrapeResult.html || ''
}
