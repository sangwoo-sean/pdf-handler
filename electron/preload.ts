import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFiles: () => ipcRenderer.invoke('dialog:open-files'),
  openFile: () => ipcRenderer.invoke('dialog:open-file'),
  readPdfFile: (filePath: string) => ipcRenderer.invoke('pdf:read-file', filePath),
  mergePdfs: (filePaths: string[]) => ipcRenderer.invoke('pdf:merge', filePaths),
  openViewer: () => ipcRenderer.invoke('window:open-viewer')
})
