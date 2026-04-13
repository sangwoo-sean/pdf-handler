import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { getPageCount, mergePdfs } from './pdf-service'

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 480,
    height: 600,
    minWidth: 400,
    minHeight: 500,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

function createViewerWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 800,
    height: 900,
    minWidth: 600,
    minHeight: 500,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: true
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(`${process.env.ELECTRON_RENDERER_URL}#viewer`)
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'viewer' })
  }

  return win
}

const allowedPdfPaths = new Set<string>()

let viewerWindow: BrowserWindow | null = null

function registerIpcHandlers(): void {
  ipcMain.handle('window:open-viewer', () => {
    if (viewerWindow && !viewerWindow.isDestroyed()) {
      viewerWindow.focus()
      return
    }
    viewerWindow = createViewerWindow()
    viewerWindow.on('closed', () => {
      viewerWindow = null
    })
  })

  ipcMain.handle('dialog:open-files', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (canceled || filePaths.length === 0) {
      return []
    }

    const results: Array<{ name: string; path: string; pageCount: number }> = []

    for (const filePath of filePaths) {
      try {
        const pageCount = await getPageCount(filePath)
        const name = basename(filePath)
        allowedPdfPaths.add(filePath)
        results.push({ name, path: filePath, pageCount })
      } catch {
        // Skip corrupted PDF files
      }
    }

    return results
  })

  ipcMain.handle('dialog:open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    const filePath = filePaths[0]
    try {
      const pageCount = await getPageCount(filePath)
      allowedPdfPaths.add(filePath)
      return { name: basename(filePath), path: filePath, pageCount }
    } catch {
      return null
    }
  })

  ipcMain.handle('pdf:read-file', async (_event, filePath: unknown) => {
    if (typeof filePath !== 'string' || !allowedPdfPaths.has(filePath)) {
      throw new Error('File not authorized for reading')
    }
    const buffer = await readFile(filePath)
    return new Uint8Array(buffer)
  })

  ipcMain.handle('pdf:merge', async (_event, filePaths: unknown) => {
    if (!Array.isArray(filePaths) || filePaths.length === 0) {
      return { success: false, error: 'Invalid file paths' }
    }
    if (!filePaths.every((p): p is string => typeof p === 'string' && p.endsWith('.pdf'))) {
      return { success: false, error: 'Only PDF files are allowed' }
    }

    try {
      const { canceled, filePath } = await dialog.showSaveDialog({
        defaultPath: 'merged.pdf',
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      })

      if (canceled || !filePath) {
        return { success: false, error: 'cancelled' }
      }

      await mergePdfs(filePaths, filePath)
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  })
}

app.whenReady().then(() => {
  registerIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
