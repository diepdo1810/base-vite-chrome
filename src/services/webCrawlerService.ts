import WebCrawler from '~/logic/webcrawler'
import type { CrawlOptions, CrawlResult } from '~/logic/webcrawler'

export async function crawlUrlWithCache(url: string, options: CrawlOptions = {}, maxAge = 5 * 60 * 1000): Promise<CrawlResult[]> {
  const crawler = new WebCrawler(options)
  return crawler.crawlWithCache(url, maxAge)
}

export async function crawlUrl(url: string, options: CrawlOptions = {}): Promise<CrawlResult[]> {
  const crawler = new WebCrawler(options)
  return crawler.crawl(url)
}
