import { app, BrowserWindow, dialog, ipcMain, nativeImage } from 'electron'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { getPageCount, mergePdfs, savePdfWithImages } from './pdf-service'
import type { SerializedOverlay } from './pdf-service'

function findPdfInArgs(argv: string[]): string | null {
  for (let i = 1; i < argv.length; i++) {
    if (argv[i].toLowerCase().endsWith('.pdf')) {
      return argv[i]
    }
  }
  return null
}

let initialPendingPath: string | null = findPdfInArgs(process.argv)
const pendingPaths = new Map<number, string>()

const iconPath = app.isPackaged
  ? join(process.resourcesPath, 'icon.png')
  : join(__dirname, '../../build/icon.png')
const appIcon = nativeImage.createFromPath(iconPath)

function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width: 480,
    height: 600,
    minWidth: 400,
    minHeight: 500,
    icon: appIcon,
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
    icon: appIcon,
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
const allowedImagePaths = new Set<string>()

function openPdfInViewer(filePath: string): void {
  allowedPdfPaths.add(filePath)
  const win = createViewerWindow()
  const webContentsId = win.webContents.id
  pendingPaths.set(webContentsId, filePath)
  win.on('closed', () => {
    pendingPaths.delete(webContentsId)
  })
}

function registerIpcHandlers(): void {
  ipcMain.handle('app:get-open-file-path', (event) => {
    const perWindowPath = pendingPaths.get(event.sender.id)
    if (perWindowPath) {
      pendingPaths.delete(event.sender.id)
      return perWindowPath
    }
    const initial = initialPendingPath
    initialPendingPath = null
    return initial
  })

  ipcMain.handle('window:open-viewer', () => {
    createViewerWindow()
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

  ipcMain.handle('dialog:open-image', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }]
    })

    if (canceled || filePaths.length === 0) {
      return null
    }

    const filePath = filePaths[0]
    try {
      allowedImagePaths.add(filePath)
      const buffer = await readFile(filePath)
      const ext = filePath.toLowerCase().split('.').pop()
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg'
      return { bytes: new Uint8Array(buffer), mimeType, name: basename(filePath) }
    } catch {
      return null
    }
  })

  ipcMain.handle(
    'pdf:save-with-images',
    async (_event, data: unknown) => {
      const parsed = data as {
        sourcePath: string
        overlays: SerializedOverlay[]
      }

      if (
        typeof parsed?.sourcePath !== 'string' ||
        !allowedPdfPaths.has(parsed.sourcePath)
      ) {
        return { success: false, error: 'Source PDF not authorized' }
      }

      try {
        const { canceled, filePath } = await dialog.showSaveDialog({
          defaultPath: 'output.pdf',
          filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
        })

        if (canceled || !filePath) {
          return { success: false, error: 'cancelled' }
        }

        await savePdfWithImages(parsed.sourcePath, filePath, parsed.overlays)
        return { success: true }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        return { success: false, error: message }
      }
    }
  )

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

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (_event, argv) => {
    const filePath = findPdfInArgs(argv)
    if (filePath) {
      openPdfInViewer(filePath)
    } else {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) {
        if (win.isMinimized()) win.restore()
        win.focus()
      }
    }
  })

  // macOS: 파일 연결로 앱이 열릴 때
  app.on('open-file', (event, filePath) => {
    event.preventDefault()
    if (app.isReady()) {
      openPdfInViewer(filePath)
    } else {
      initialPendingPath = filePath
    }
  })

  app.whenReady().then(() => {
    registerIpcHandlers()

    if (initialPendingPath) {
      const startupPath = initialPendingPath
      initialPendingPath = null
      openPdfInViewer(startupPath)
    } else {
      createWindow()
    }

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
}
