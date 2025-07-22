const forbiddenProtocols = [
  'chrome-extension://',
  'chrome-search://',
  'chrome://',
  'devtools://',
  'edge://',
  'https://chrome.google.com/webstore',
]

export function isForbiddenUrl(url: string): boolean {
  return forbiddenProtocols.some(protocol => url.startsWith(protocol))
}

export const isFirefox = navigator.userAgent.includes('Firefox')

interface ImportMetaEnv {
  readonly VITE_FIRECRAWL_API_KEY: string
  readonly VITE_DIFFBOT_TOKEN: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
