/// <reference types="vite/client" />

interface ElectronAPI {
  openFiles: () => Promise<Array<{ name: string; path: string; pageCount: number }>>
  mergePdfs: (filePaths: string[]) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
