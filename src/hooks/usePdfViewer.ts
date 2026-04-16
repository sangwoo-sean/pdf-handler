import { useCallback, useEffect, useRef, useState } from 'react'
// pdfjs-dist 5.x modern 빌드는 Chrome 139+ API(toHex, getOrInsertComputed)를 사용
// Electron 35 (Chromium ~134)에서는 legacy 빌드가 필요 (폴리필 내장)
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs'
import type { PDFDocumentProxy, RenderTask } from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url
).href

// CJK(한국어 등) CMap과 표준14 폰트 데이터는 pdfjs-dist에 내장되지 않음.
// scripts/copy-pdfjs-assets.mjs가 publicDir로 복사한 자산을 document.baseURI 기준으로 해석한다.
// dev: http://host/pdfjs/...   prod(electron): file:///.../out/renderer/pdfjs/...
const PDFJS_CMAP_URL = new URL('./pdfjs/cmaps/', document.baseURI).href
const PDFJS_STANDARD_FONT_URL = new URL('./pdfjs/standard_fonts/', document.baseURI).href

const RENDER_SCALE = 1.5

export interface PdfPageSize {
  readonly width: number
  readonly height: number
}

export interface UsePdfViewerReturn {
  readonly fileName: string | null
  readonly filePath: string | null
  readonly isLoading: boolean
  readonly currentPage: number
  readonly totalPages: number
  readonly pdfPageSize: PdfPageSize | null
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>
  readonly openFile: () => Promise<void>
  readonly nextPage: () => void
  readonly prevPage: () => void
}

function cancelRenderTask(ref: React.RefObject<RenderTask | null>): void {
  if (ref.current) {
    ref.current.cancel()
    ref.current = null
  }
}

function isRenderCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.message.includes('cancel') || error.name.includes('Cancel')
}

export function usePdfViewer(options?: { autoOpen?: boolean }): UsePdfViewerReturn {
  const [fileName, setFileName] = useState<string | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pdfPageSize, setPdfPageSize] = useState<PdfPageSize | null>(null)

  const pdfDocRef = useRef<PDFDocumentProxy | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderTaskRef = useRef<RenderTask | null>(null)

  const renderPage = useCallback(async (pageNumber: number) => {
    const pdfDoc = pdfDocRef.current
    const canvas = canvasRef.current
    if (!pdfDoc || !canvas || pageNumber < 1 || pageNumber > pdfDoc.numPages) return

    cancelRenderTask(renderTaskRef)

    let page
    try {
      page = await pdfDoc.getPage(pageNumber)
    } catch {
      return
    }

    if (!canvasRef.current) return

    const viewport = page.getViewport({ scale: RENDER_SCALE })
    canvas.width = viewport.width
    canvas.height = viewport.height

    const unscaledViewport = page.getViewport({ scale: 1 })
    setPdfPageSize({ width: unscaledViewport.width, height: unscaledViewport.height })

    const canvasContext = canvas.getContext('2d')
    if (!canvasContext) return

    const renderTask = page.render({
      canvasContext,
      viewport
    } as Parameters<typeof page.render>[0])
    renderTaskRef.current = renderTask

    try {
      await renderTask.promise
    } catch (error) {
      if (isRenderCancelled(error)) return
      throw error
    }
  }, [])

  useEffect(() => {
    if (currentPage > 0) {
      renderPage(currentPage).catch(() => {})
    }
  }, [currentPage, renderPage])

  useEffect(() => {
    return () => {
      cancelRenderTask(renderTaskRef)
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy()
        pdfDocRef.current = null
      }
    }
  }, [])

  const openFileRef = useRef(false)

  const loadPdfFromPath = useCallback(async (path: string) => {
    setIsLoading(true)
    try {
      cancelRenderTask(renderTaskRef)
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy()
        pdfDocRef.current = null
      }

      const bytes = await window.electronAPI.readPdfFile(path)
      const pdfDoc = await pdfjs.getDocument({
        data: bytes,
        cMapUrl: PDFJS_CMAP_URL,
        cMapPacked: true,
        standardFontDataUrl: PDFJS_STANDARD_FONT_URL
      }).promise

      pdfDocRef.current = pdfDoc
      setFileName(path.replace(/.*[\\/]/, ''))
      setFilePath(path)
      setTotalPages(pdfDoc.numPages)
      setCurrentPage(1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`PDF를 열 수 없습니다: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const openFile = useCallback(async () => {
    const result = await window.electronAPI.openFile()
    if (!result) return
    await loadPdfFromPath(result.path)
  }, [loadPdfFromPath])

  useEffect(() => {
    if (options?.autoOpen && !openFileRef.current) {
      openFileRef.current = true
      ;(async () => {
        const pendingPath = await window.electronAPI.getOpenFilePath()
        if (pendingPath) {
          await loadPdfFromPath(pendingPath)
        } else {
          await openFile()
        }
      })()
    }
  }, [options?.autoOpen, openFile, loadPdfFromPath])

  useEffect(() => {
    window.electronAPI.onOpenFile((path) => {
      loadPdfFromPath(path)
    })
  }, [loadPdfFromPath])

  const printingRef = useRef(false)
  const print = useCallback(async () => {
    const pdfDoc = pdfDocRef.current
    if (!pdfDoc || printingRef.current) return
    printingRef.current = true

    const container = document.createElement('div')
    container.className = 'pdf-print-container'

    const style = document.createElement('style')
    style.textContent = `
      .pdf-print-container { position: absolute; left: -99999px; top: -99999px; }
      @media print {
        body > *:not(.pdf-print-container) { display: none !important; }
        .pdf-print-container { position: static !important; left: auto !important; top: auto !important; }
        .pdf-print-container img { width: 100%; display: block; break-after: page; page-break-after: always; }
        .pdf-print-container img:last-child { break-after: auto; page-break-after: auto; }
        @page { size: auto; margin: 0; }
      }
    `

    const cleanup = (): void => {
      container.remove()
      style.remove()
      printingRef.current = false
    }

    try {
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        await page.render({
          canvasContext: ctx,
          viewport
        } as Parameters<typeof page.render>[0]).promise
        const img = document.createElement('img')
        img.src = canvas.toDataURL('image/png')
        container.appendChild(img)
      }

      document.head.appendChild(style)
      document.body.appendChild(container)
      window.addEventListener('afterprint', cleanup, { once: true })

      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
      window.print()
    } catch (error) {
      console.error('Print failed:', error)
      cleanup()
    }
  }, [])

  useEffect(() => {
    window.electronAPI.onPrintRequest(() => {
      print().catch(() => {})
    })
  }, [print])

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev))
  }, [totalPages])

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => (prev > 1 ? prev - 1 : prev))
  }, [])

  return {
    fileName,
    filePath,
    isLoading,
    currentPage,
    totalPages,
    pdfPageSize,
    canvasRef,
    openFile,
    nextPage,
    prevPage
  }
}
