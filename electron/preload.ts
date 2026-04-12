import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  openFiles: () => ipcRenderer.invoke('dialog:open-files'),
  mergePdfs: (filePaths: string[]) => ipcRenderer.invoke('pdf:merge', filePaths)
})
