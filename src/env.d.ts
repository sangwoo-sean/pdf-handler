/// <reference types="vite/client" />

interface ElectronAPI {
  openFiles: () => Promise<Array<{ name: string; path: string; pageCount: number }>>
  openFile: () => Promise<{ name: string; path: string; pageCount: number } | null>
  readPdfFile: (filePath: string) => Promise<Uint8Array>
  mergePdfs: (filePaths: string[]) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
