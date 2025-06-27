/* eslint-disable no-console */
/* eslint-disable unused-imports/no-unused-vars */
import type { AxiosInstance } from 'axios'
import axios from 'axios'
import * as cheerio from 'cheerio'
import robotsParser from 'robots-parser'

interface ArticleData {
  title: string
  content: string
  author?: string
  publishDate?: string
  summary?: string
  tags?: string[]
  readingTime?: number
  language?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

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
  extractArticleData?: boolean
  detectLanguage?: boolean
  extractKeywords?: boolean
}

interface CrawlResult {
  url: string
  title: string
  content: string
  links: string[]
  metadata: Record<string, any>
  depth: number
  timestamp: Date
  article?: ArticleData
  keywords?: string[]
  language?: string
  difficulty?: 'easy' | 'medium' | 'hard'
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
  private static cache = new Map<string, { result: CrawlResult, timestamp: number }>()

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
      extractArticleData: options.extractArticleData ?? true,
      detectLanguage: options.detectLanguage ?? true,
      extractKeywords: options.extractKeywords ?? true,
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

        // Extract thông tin chi tiết bài báo
        if (this.options.extractArticleData) {
          result.article = this.extractArticleData($)
        }

        // Extract keywords
        if (this.options.extractKeywords) {
          result.keywords = this.extractKeywords(result.article?.content || '', result.article?.title || '')
        }

        // Detect language
        if (this.options.detectLanguage) {
          result.language = result.article?.language || this.detectLanguage(result.article?.content || '')
        }

        // Estimate difficulty
        result.difficulty = result.article?.difficulty || this.estimateDifficulty(result.article?.content || '')

        this.results.set(url, result)

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
   * Extract nội dung text từ HTML (cải thiện cho bài báo)
   */
  private extractContent($: cheerio.CheerioAPI): string {
    // Loại bỏ nhiều phần không cần thiết hơn cho bài báo
    $('script, style, nav, footer, aside, .sidebar, .ads, .advertisement, .social-share, .comments, .related-posts').remove()

    console.log(`Using selector: ${this.options.selector}`)

    // Nếu có selector được chỉ định, sử dụng nó
    if (this.options.selector) {
      const selectedElements = $(this.options.selector)
      if (selectedElements.length > 0) {
        return this.cleanText(selectedElements.text())
      }
      console.warn(`No elements found with selector: ${this.options.selector}`)
    }

    // Ưu tiên các selector cho bài báo
    const articleSelectors = [
      'article',
      '[role="main"]',
      '.post-content',
      '.entry-content',
      '.article-content',
      '.story-body',
      '.content-body',
      '.article-body',
      '.post-body',
      'main',
      '.content',
      '.post',
      '.entry',
    ]

    // Thử các selector phổ biến cho bài báo
    for (const selector of articleSelectors) {
      const element = $(selector).first()
      if (element.length > 0) {
        const text = this.cleanText(element.text())
        if (text.length > 100) { // Đảm bảo có đủ nội dung
          return text
        }
      }
    }

    // Fallback
    return this.cleanText($('body').text()).substring(0, 10000)
  }

  /**
   * Làm sạch text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Thay thế nhiều space bằng 1
      .replace(/\n\s*\n/g, '\n') // Thay thế nhiều newline bằng 1
      .replace(/[\r\n\t]+/g, ' ') // Thay thế các ký tự xuống dòng bằng space
      .trim()
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
   * Extract thông tin chi tiết bài báo
   */
  private extractArticleData($: cheerio.CheerioAPI): ArticleData {
    // Extract title với nhiều fallback
    const title = $('h1').first().text().trim()
      || $('title').text().trim()
      || $('[property="og:title"]').attr('content')
      || $('[name="twitter:title"]').attr('content') || ''

    // Extract author
    const author = $('[rel="author"]').text().trim()
      || $('[name="author"]').attr('content')
      || $('.author, .byline, .writer').text().trim()
      || $('[property="article:author"]').attr('content')
      || $('[name="twitter:creator"]').attr('content') || ''

    // Extract publish date
    const publishDate = $('time').attr('datetime')
      || $('[property="article:published_time"]').attr('content')
      || $('[name="date"]').attr('content')
      || $('.date, .published').attr('datetime') || ''

    // Extract summary/description
    const summary = $('[name="description"]').attr('content')
      || $('[property="og:description"]').attr('content')
      || $('[name="twitter:description"]').attr('content')
      || $('.summary, .excerpt, .lead').text().trim() || ''

    // Extract tags
    const tags = $('.tags a, .tag, .category, .label')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(tag => tag.length > 0)

    const content = this.extractContent($)

    // Estimate reading time (average 200 words per minute)
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    // Detect language
    const language = $('html').attr('lang')
      || $('[name="language"]').attr('content')
      || $('[property="og:locale"]').attr('content')
      || this.detectLanguage(content)

    // Estimate difficulty based on content
    const difficulty = this.estimateDifficulty(content)

    return {
      title,
      content,
      author,
      publishDate,
      summary,
      tags,
      readingTime,
      language,
      difficulty,
    }
  }

  /**
   * Extract keywords từ content
   */
  private extractKeywords(content: string, title: string): string[] {
    // Stop words cho tiếng Anh và tiếng Việt
    const stopWords = new Set([
      // English
      'the',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'from',
      'up',
      'about',
      'into',
      'through',
      'during',
      'before',
      'after',
      'above',
      'below',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'shall',
      'this',
      'that',
      'these',
      'those',
      'i',
      'me',
      'my',
      'myself',
      'we',
      'our',
      'ours',
      'ourselves',
      'you',
      'your',
      'yours',
      'yourself',
      'yourselves',
      'he',
      'him',
      'his',
      'himself',
      'she',
      'her',
      'hers',
      'herself',
      'it',
      'its',
      'itself',
      'they',
      'them',
      'their',
      'theirs',
      'themselves',
      // Vietnamese
      'là',
      'của',
      'và',
      'có',
      'trong',
      'với',
      'để',
      'cho',
      'về',
      'từ',
      'khi',
      'được',
      'sẽ',
      'đã',
      'này',
      'đó',
      'những',
      'các',
      'một',
      'hai',
      'ba',
      'bốn',
      'năm',
      'sáu',
      'bảy',
      'tám',
      'chín',
      'mười',
    ])

    const words = (`${title} ${content}`)
      .toLowerCase()
      .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))

    // Count word frequency
    const wordCount = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Return top keywords
    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([word]) => word)
  }

  /**
   * Detect language của content
   */
  private detectLanguage(content: string): string {
    const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/gi
    const vietnameseWords = /\b(của|và|có|trong|với|để|cho|về|từ|khi|được|sẽ|đã|này|đó|những|các)\b/gi

    const vietnameseCharCount = (content.match(vietnameseChars) || []).length
    const vietnameseWordCount = (content.match(vietnameseWords) || []).length

    if (vietnameseCharCount > 10 || vietnameseWordCount > 5) {
      return 'vi'
    }

    return 'en'
  }

  /**
   * Estimate difficulty level của content
   */
  private estimateDifficulty(content: string): 'easy' | 'medium' | 'hard' {
    const words = content.split(/\s+/)
    const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    const sentenceCount = content.split(/[.!?]+/).length
    const averageSentenceLength = words.length / sentenceCount

    // Simple heuristic based on word and sentence length
    if (averageWordLength > 6 || averageSentenceLength > 25) {
      return 'hard'
    }
    else if (averageWordLength > 5 || averageSentenceLength > 15) {
      return 'medium'
    }
    else {
      return 'easy'
    }
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

  /**
   * Crawl với cache để tăng performance
   */
  async crawlWithCache(url: string, maxAge = 5 * 60 * 1000): Promise<CrawlResult[]> {
    const cacheKey = this.normalizeUrl(url)
    const cached = WebCrawler.cache.get(cacheKey)

    if (cached && Date.now() - cached.timestamp < maxAge) {
      console.log(`Using cached result for: ${url}`)
      return [cached.result]
    }

    const results = await this.crawl(url)
    if (results.length > 0) {
      WebCrawler.cache.set(cacheKey, {
        result: results[0],
        timestamp: Date.now(),
      })
    }

    return results
  }

  /**
   * Crawl current tab (dành cho Chrome Extension)
   */
  async crawlCurrentTab(): Promise<CrawlResult | null> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
          if (tabs[0]?.url) {
            try {
              const results = await this.crawlWithCache(tabs[0].url)
              resolve(results[0] || null)
            }
            catch (error) {
              console.error('Error crawling current tab:', error)
              resolve(null)
            }
          }
          else {
            resolve(null)
          }
        })
      }
      else {
        console.warn('Chrome tabs API not available')
        resolve(null)
      }
    })
  }
}

export default WebCrawler
export {
  WebCrawler,
  CrawlOptions,
  CrawlResult,
  QueueItem,
  ArticleData,
}
export type {
  CrawlOptions as WebCrawlerOptions,
  CrawlResult as WebCrawlerResult,
  QueueItem as WebCrawlerQueueItem,
  ArticleData as WebCrawlerArticleData,
}
