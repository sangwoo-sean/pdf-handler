/// <reference types="vite/client" />

interface ElectronAPI {
  openFiles: () => Promise<Array<{ name: string; path: string; pageCount: number }>>
  openFile: () => Promise<{ name: string; path: string; pageCount: number } | null>
  readPdfFile: (filePath: string) => Promise<Uint8Array>
  mergePdfs: (filePaths: string[]) => Promise<{ success: boolean; error?: string }>
  openViewer: () => Promise<void>
  openImage: () => Promise<{ bytes: Uint8Array; mimeType: string; name: string } | null>
  getOpenFilePath: () => Promise<string | null>
  onOpenFile: (callback: (filePath: string) => void) => void
  savePdfWithImages: (data: {
    sourcePath: string
    overlays: Array<{
      pageNumber: number
      x: number
      y: number
      width: number
      height: number
      rotation: number
      bytes: Uint8Array
      mimeType: string
    }>
  }) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}

export {}
