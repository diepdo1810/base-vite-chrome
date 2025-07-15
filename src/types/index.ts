// Import existing interfaces
export * from './article-suggestions'
export * from './pollinations'

// Chrome Extension specific interfaces
interface IChromeExtensionConfig {
  name: string
  version: string
  manifestVersion: number
  permissions: string[]
  host_permissions?: string[]
  content_scripts?: IContentScript[]
  background?: IBackgroundScript
  action?: IExtensionAction
}

interface IContentScript {
  matches: string[]
  js?: string[]
  css?: string[]
  run_at?: 'document_start' | 'document_end' | 'document_idle'
  all_frames?: boolean
}

interface IBackgroundScript {
  service_worker?: string
  scripts?: string[]
  persistent?: boolean
}

interface IExtensionAction {
  default_popup?: string
  default_title?: string
  default_icon?: Record<string, string>
}

interface IChromeTab {
  id?: number
  url?: string
  title?: string
  active?: boolean
  highlighted?: boolean
  windowId?: number
  index?: number
  status?: 'loading' | 'complete'
}

interface IChromeMessage {
  type: string
  payload?: any
  tabId?: number
  origin?: string
}

interface IWebCrawlerOptions {
  maxDepth?: number
  maxPages?: number
  extractArticleData?: boolean
  detectLanguage?: boolean
  extractKeywords?: boolean
  includeImages?: boolean
  followRedirects?: boolean
}

interface IArticleData {
  title?: string
  author?: string
  publishDate?: Date
  readingTime?: number
  difficulty?: 'easy' | 'medium' | 'hard'
  summary?: string
  keywords?: string[]
  categories?: string[]
}

interface ICrawlResult {
  url: string
  title: string
  content: string
  article?: IArticleData
  language?: string
  keywords?: string[]
  images?: string[]
  links?: string[]
  metadata?: Record<string, any>
  timestamp?: Date
}

// API Response types
interface IDataResponse {
  success: boolean
  message: string
  data: any
}

interface IDataResponseGeneric<T> {
  success: boolean
  message: string
  data: T[]
  total?: number
  page?: number
  per_page?: number
  current_page?: number
  last_page?: number
}

// Form validation
interface IErrors {
  [key: string]: string | null
}

interface IValidationRule {
  required?: boolean
  min?: number
  max?: number
  email?: boolean
  numeric?: boolean
  pattern?: RegExp
  custom?: (value: any) => string | null
}

interface IFormValidation {
  [key: string]: IValidationRule[]
}

// Constants
interface IDanhMuc {
  id: number
  ten: string
  ma: string
  mo_ta?: string
  thu_tu?: number
  trang_thai?: number
  parent_id?: number
  level?: number
  created_at?: Date
  updated_at?: Date
}

// Focus flow
interface FieldConfig {
  name: string
  type: 'input' | 'select' | 'autocomplete' | 'calendar' | 'button'
  required?: boolean
  disabled?: boolean
  visible?: boolean
  tabIndex?: number
}

interface IFocusFlow {
  fields: FieldConfig[]
  currentIndex: number
  direction: 'forward' | 'backward'
}

// UI Components
interface ITableColumn {
  key: string
  title: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: any, index: number) => any
}

interface ITableConfig {
  columns: ITableColumn[]
  data: any[]
  loading?: boolean
  pagination?: {
    current: number
    pageSize: number
    total: number
    showSizeChanger?: boolean
    showQuickJumper?: boolean
  }
  selection?: {
    type: 'checkbox' | 'radio'
    selectedRowKeys: any[]
    onChange: (selectedRowKeys: any[], selectedRows: any[]) => void
  }
}

interface IModalConfig {
  title: string
  visible: boolean
  width?: string | number
  closable?: boolean
  maskClosable?: boolean
  footer?: boolean
  onOk?: () => void
  onCancel?: () => void
}

interface IFormItemConfig {
  label: string
  name: string
  type: 'input' | 'select' | 'textarea' | 'number' | 'date' | 'checkbox' | 'radio'
  placeholder?: string
  options?: Array<{ label: string, value: any }>
  rules?: IValidationRule[]
  disabled?: boolean
  required?: boolean
  span?: number
}

// Export all interfaces
export type {
  // Chrome Extension specific
  IChromeExtensionConfig,
  IContentScript,
  IBackgroundScript,
  IExtensionAction,
  IChromeTab,
  IChromeMessage,
  IWebCrawlerOptions,
  IArticleData,
  ICrawlResult,
  // General types
  IDataResponse,
  IDataResponseGeneric,
  IErrors,
  IValidationRule,
  IFormValidation,
  IDanhMuc,
  FieldConfig,
  IFocusFlow,
  ITableColumn,
  ITableConfig,
  IModalConfig,
  IFormItemConfig,
}
