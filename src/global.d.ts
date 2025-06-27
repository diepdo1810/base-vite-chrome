declare const __DEV__: boolean
/** Extension name, defined in packageJson.name */
declare const __NAME__: string

// Chrome extension APIs
declare const chrome: any

declare module '*.vue' {
  const component: any
  export default component
}
