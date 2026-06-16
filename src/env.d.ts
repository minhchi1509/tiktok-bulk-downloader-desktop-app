/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly MAIN_VITE_TOOL_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
