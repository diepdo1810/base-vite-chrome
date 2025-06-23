/* eslint-disable unused-imports/no-unused-vars */
import type { AxiosInstance } from 'axios'
import axios from 'axios'
import * as cheerio from 'cheerio'
import robotsParser from 'robots-parser'

interface CrawlOptions {
  maxDepth?: number
  maxPages?: number
  crawlDelay?: number
  timeout?: number
  userAgent?: string
  respectRobots?: boolean
  followSitemap?: boolean
  allowedDomains?: string[]
  disallowedExtensions?: string[]
  retryAttempts?: number
  retryDelay?: number
  selector?: string
}

interface CrawlResult {
  url: string
  title: string
  content: string
  links: string[]
  metadata: Record<string, any>
  depth: number
  timestamp: Date
}

interface QueueItem {
  url: string
  depth: number
  parentUrl?: string
}

class WebCrawler {
  private options: Required<CrawlOptions>
  private axiosInstance: AxiosInstance
  private robotsCache: Map<string, any> = new Map()
  private visitedUrls: Set<string> = new Set()
  private queue: QueueItem[] = []
  private results: Map<string, CrawlResult> = new Map()
  private isRunning: boolean = false

  constructor(options: CrawlOptions = {}) {
    this.options = {
      maxDepth: options.maxDepth ?? 3,
      maxPages: options.maxPages ?? 100,
      crawlDelay: options.crawlDelay ?? 1000,
      timeout: options.timeout ?? 30000,
      userAgent: options.userAgent ?? 'WebCrawler/1.0',
      respectRobots: options.respectRobots ?? true,
      followSitemap: options.followSitemap ?? true,
      allowedDomains: options.allowedDomains ?? [],
      disallowedExtensions: options.disallowedExtensions ?? [
        'jpg',
        'jpeg',
        'png',
        'gif',
        'svg',
        'ico',
        'css',
        'js',
        'pdf',
        'doc',
        'docx',
        'xls',
        'xlsx',
        'zip',
        'rar',
        'mp3',
        'mp4',
        'avi',
        'mov',
      ],
      retryAttempts: options.retryAttempts ?? 3,
      retryDelay: options.retryDelay ?? 2000,
      selector: options.selector ?? '',
    }

    this.axiosInstance = axios.create({
      timeout: this.options.timeout,
      headers: {
        'User-Agent': this.options.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    })
  }

  /**
   * Bắt đầu crawl từ URL gốc
   */
  async crawl(startUrl: string): Promise<CrawlResult[]> {
    if (this.isRunning) {
      throw new Error('Crawler is already running')
    }

    this.isRunning = true
    this.reset()

    try {
      // Kiểm tra và load robots.txt nếu cần
      if (this.options.respectRobots) {
        await this.loadRobots(startUrl)
      }

      // Kiểm tra sitemap nếu cần
      if (this.options.followSitemap) {
        await this.loadSitemap(startUrl)
      }

      // Thêm URL gốc vào queue
      this.addToQueue(startUrl, 0)

      // Bắt đầu crawl
      await this.processQueue()

      return Array.from(this.results.values())
    }
    finally {
      this.isRunning = false
    }
  }

  /**
   * Reset crawler state
   */
  private reset(): void {
    this.visitedUrls.clear()
    this.queue = []
    this.results.clear()
    this.robotsCache.clear()
  }

  /**
   * Load và parse robots.txt
   */
  private async loadRobots(url: string): Promise<void> {
    try {
      const parsedUrl = new URL(url)
      const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`
      const domain = parsedUrl.host

      if (this.robotsCache.has(domain)) {
        return
      }

      const response = await this.axiosInstance.get(robotsUrl)
      const robots = robotsParser(robotsUrl, response.data)
      this.robotsCache.set(domain, robots)

      // eslint-disable-next-line no-console
      console.log(`Loaded robots.txt for ${domain}`)
    }
    catch (error) {
      console.warn(`Could not load robots.txt for ${url}:`, error instanceof Error ? error.message : 'Unknown error')
      // Nếu không load được robots.txt, tạo một robots parser rỗng
      const parsedUrl = new URL(url)
      this.robotsCache.set(parsedUrl.host, robotsParser('', ''))
    }
  }

  /**
   * Load sitemap và thêm URLs vào queue
   */
  private async loadSitemap(url: string): Promise<void> {
    try {
      const parsedUrl = new URL(url)
      const sitemapUrl = `${parsedUrl.protocol}//${parsedUrl.host}/sitemap.xml`

      const response = await this.axiosInstance.get(sitemapUrl)
      const $ = cheerio.load(response.data, { xmlMode: true })

      // Xử lý sitemap index
      $('sitemapindex sitemap loc').each((_, element) => {
        const sitemapLoc = $(element).text().trim()
        if (sitemapLoc) {
          this.loadSitemap(sitemapLoc).catch(err =>
            console.warn(`Failed to load sitemap: ${sitemapLoc}`, err.message),
          )
        }
      })

      // Xử lý URL trong sitemap
      $('urlset url loc').each((_, element) => {
        const urlLoc = $(element).text().trim()
        if (urlLoc && this.isValidUrl(urlLoc)) {
          this.addToQueue(urlLoc, 0)
        }
      })

      // eslint-disable-next-line no-console
      console.log(`Loaded sitemap: ${sitemapUrl}`)
    }
    catch (error) {
      console.warn(`Could not load sitemap for ${url}:`, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Kiểm tra robots.txt có cho phép crawl URL không
   */
  private canCrawl(url: string): boolean {
    if (!this.options.respectRobots) {
      return true
    }

    try {
      const parsedUrl = new URL(url)
      const robots = this.robotsCache.get(parsedUrl.host)

      if (!robots) {
        return true // Nếu không có robots.txt, cho phép crawl
      }

      return robots.isAllowed(url, this.options.userAgent)
    }
    catch (error) {
      console.warn(`Error checking robots.txt for ${url}:`, error instanceof Error ? error.message : 'Unknown error')
      return true
    }
  }

  /**
   * Lấy crawl delay từ robots.txt
   */
  private getCrawlDelay(url: string): number {
    if (!this.options.respectRobots) {
      return this.options.crawlDelay
    }

    try {
      const parsedUrl = new URL(url)
      const robots = this.robotsCache.get(parsedUrl.host)

      if (!robots) {
        return this.options.crawlDelay
      }

      const delay = robots.getCrawlDelay(this.options.userAgent)
      return delay ? delay * 1000 : this.options.crawlDelay
    }
    catch (error) {
      return this.options.crawlDelay
    }
  }

  /**
   * Thêm URL vào queue
   */
  private addToQueue(url: string, depth: number, parentUrl?: string): void {
    const normalizedUrl = this.normalizeUrl(url)

    if (this.shouldSkipUrl(normalizedUrl, depth)) {
      return
    }

    if (!this.visitedUrls.has(normalizedUrl)) {
      this.queue.push({ url: normalizedUrl, depth, parentUrl })
    }
  }

  /**
   * Chuẩn hóa URL
   */
  private normalizeUrl(url: string): string {
    try {
      const parsedUrl = new URL(url)

      // Loại bỏ fragment
      parsedUrl.hash = ''

      // Sắp xếp query parameters
      parsedUrl.searchParams.sort()

      // Loại bỏ trailing slash (trừ root)
      if (parsedUrl.pathname !== '/' && parsedUrl.pathname.endsWith('/')) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, -1)
      }

      return parsedUrl.toString().toLowerCase()
    }
    catch (error) {
      return url
    }
  }

  /**
   * Kiểm tra có nên bỏ qua URL không
   */
  private shouldSkipUrl(url: string, depth: number): boolean {
    try {
      const parsedUrl = new URL(url)

      // Kiểm tra depth
      if (depth > this.options.maxDepth) {
        return true
      }

      // Kiểm tra domain được phép
      if (this.options.allowedDomains.length > 0) {
        const allowed = this.options.allowedDomains.some(domain =>
          parsedUrl.hostname.includes(domain),
        )
        if (!allowed) {
          return true
        }
      }

      // Kiểm tra extension không được phép
      const pathname = parsedUrl.pathname.toLowerCase()
      const hasDisallowedExt = this.options.disallowedExtensions.some(ext =>
        pathname.endsWith(`.${ext}`),
      )

      return hasDisallowedExt || this.visitedUrls.has(url)
    }
    catch (error) {
      return true
    }
  }

  /**
   * Kiểm tra URL hợp lệ
   */
  private isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      return ['http:', 'https:'].includes(parsedUrl.protocol)
    }
    catch (error) {
      return false
    }
  }

  /**
   * Xử lý queue crawl
   */
  private async processQueue(): Promise<void> {
    const concurrency = 3 // Số request đồng thời
    const workers: Promise<void>[] = []

    for (let i = 0; i < Math.min(concurrency, this.queue.length); i++) {
      workers.push(this.worker())
    }

    await Promise.all(workers)
  }

  /**
   * Worker xử lý từng item trong queue
   */
  private async worker(): Promise<void> {
    while (this.queue.length > 0 && this.results.size < this.options.maxPages) {
      const item = this.queue.shift()
      if (!item || this.visitedUrls.has(item.url)) {
        continue
      }

      try {
        await this.crawlPage(item)

        // Delay theo robots.txt hoặc cấu hình
        const delay = this.getCrawlDelay(item.url)
        if (delay > 0) {
          await this.sleep(delay)
        }
      }
      catch (error) {
        console.error(`Error crawling ${item.url}:`, error instanceof Error ? error.message : 'Unknown error')
      }
    }
  }

  /**
   * Crawl một trang cụ thể
   */
  private async crawlPage(item: QueueItem): Promise<void> {
    const { url, depth, parentUrl } = item

    // Kiểm tra robots.txt
    if (!this.canCrawl(url)) {
      // eslint-disable-next-line no-console
      console.log(`Robots.txt disallows crawling: ${url}`)
      return
    }

    // Đánh dấu đã visited
    this.visitedUrls.add(url)

    let attempt = 0
    while (attempt < this.options.retryAttempts) {
      try {
        const response = await this.axiosInstance.get(url)

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`)
        }

        const contentType = response.headers['content-type'] || ''
        if (!contentType.includes('text/html')) {
          // eslint-disable-next-line no-console
          console.log(`Skipping non-HTML content: ${url}`)
          return
        }

        const $ = cheerio.load(response.data)

        // Extract dữ liệu
        const result: CrawlResult = {
          url,
          title: $('title').text().trim() || '',
          content: this.extractContent($),
          links: this.extractLinks($, url),
          metadata: this.extractMetadata($),
          depth,
          timestamp: new Date(),
        }

        this.results.set(url, result)
        // eslint-disable-next-line no-console
        console.log(`Crawled [${depth}]: ${url}`)

        // Thêm links vào queue nếu chưa đạt max depth
        if (depth < this.options.maxDepth) {
          result.links.forEach((link) => {
            this.addToQueue(link, depth + 1, url)
          })
        }

        break // Thành công, thoát vòng lặp retry
      }
      catch (error) {
        attempt++
        console.warn(`Attempt ${attempt} failed for ${url}:`, error instanceof Error ? error.message : 'Unknown error')

        if (attempt >= this.options.retryAttempts) {
          throw error
        }

        await this.sleep(this.options.retryDelay * attempt)
      }
    }
  }

  /**
   * Extract nội dung text từ HTML
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Loại bỏ script, style, nav, footer
    $('script, style, nav, footer, aside, .sidebar').remove()

    // Nếu có selector được chỉ định, sử dụng nó
    if (this.options.selector) {
      const selectedElements = $(this.options.selector)
      if (selectedElements.length > 0) {
        return selectedElements.text().replace(/\s+/g, ' ').trim()
      }
      // Nếu không tìm thấy phần tử nào với selector đã chỉ định,
      // log cảnh báo và tiếp tục với logic mặc định
      console.warn(`No elements found with selector: ${this.options.selector}`)
    }

    const mainContent = $('main, article, .content, .post, .entry').first()
    if (mainContent.length > 0) {
      return mainContent.text().replace(/\s+/g, ' ').trim()
    }

    return $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000)
  }

  /**
   * Extract links từ trang
   */
  private extractLinks($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links: string[] = []

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href')
      if (!href)
        return

      try {
        const absoluteUrl = new URL(href, baseUrl).toString()
        if (this.isValidUrl(absoluteUrl)) {
          links.push(absoluteUrl)
        }
      }
      catch (error) {
        // Ignore invalid URLs
      }
    })

    return [...new Set(links)] // Remove duplicates
  }

  /**
   * Extract metadata từ trang
   */
  private extractMetadata($: cheerio.CheerioAPI): Record<string, any> {
    const metadata: Record<string, any> = {}

    // Meta tags
    $('meta').each((_, element) => {
      const name = $(element).attr('name') || $(element).attr('property')
      const content = $(element).attr('content')

      if (name && content) {
        metadata[name] = content
      }
    })

    // Canonical URL
    const canonical = $('link[rel="canonical"]').attr('href')
    if (canonical) {
      metadata.canonical = canonical
    }

    // H1 tags
    const h1s = $('h1').map((_, el) => $(el).text().trim()).get()
    if (h1s.length > 0) {
      metadata.headings = h1s
    }

    return metadata
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Dừng crawler
   */
  stop(): void {
    this.isRunning = false
    this.queue = []
  }

  /**
   * Lấy thống kê crawl
   */
  getStats(): { visited: number, queued: number, results: number } {
    return {
      visited: this.visitedUrls.size,
      queued: this.queue.length,
      results: this.results.size,
    }
  }
}

export default WebCrawler
export {
  WebCrawler,
  CrawlOptions,
  CrawlResult,
  QueueItem,
}
export type {
  CrawlOptions as WebCrawlerOptions,
  CrawlResult as WebCrawlerResult,
  QueueItem as WebCrawlerQueueItem,
}
