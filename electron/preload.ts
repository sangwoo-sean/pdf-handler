import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFiles: () => ipcRenderer.invoke('dialog:open-files'),
  openFile: () => ipcRenderer.invoke('dialog:open-file'),
  readPdfFile: (filePath: string) => ipcRenderer.invoke('pdf:read-file', filePath),
  mergePdfs: (filePaths: string[]) => ipcRenderer.invoke('pdf:merge', filePaths),
  openViewer: () => ipcRenderer.invoke('window:open-viewer'),
  openImage: () => ipcRenderer.invoke('dialog:open-image'),
  getOpenFilePath: () => ipcRenderer.invoke('app:get-open-file-path'),
  onOpenFile: (callback: (filePath: string) => void) => {
    ipcRenderer.on('open-file', (_event, filePath) => callback(filePath))
  },
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
  }) => ipcRenderer.invoke('pdf:save-with-images', data)
})
