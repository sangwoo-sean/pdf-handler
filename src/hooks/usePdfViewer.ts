import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).href

const RENDER_SCALE = 1.5

export interface UsePdfViewerReturn {
  readonly fileName: string | null
  readonly filePath: string | null
  readonly isLoading: boolean
  readonly currentPage: number
  readonly totalPages: number
  readonly canvasRef: React.RefObject<HTMLCanvasElement | null>
  readonly openFile: () => Promise<void>
  readonly nextPage: () => void
  readonly prevPage: () => void
}

function cancelRenderTask(ref: React.RefObject<pdfjs.RenderTask | null>): void {
  if (ref.current) {
    ref.current.cancel()
    ref.current = null
  }
}

function isRenderCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  return error.message.includes('cancel') || error.name.includes('Cancel')
}

export function usePdfViewer(): UsePdfViewerReturn {
  const [fileName, setFileName] = useState<string | null>(null)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const pdfDocRef = useRef<PDFDocumentProxy | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const renderTaskRef = useRef<pdfjs.RenderTask | null>(null)

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

    const context = canvas.getContext('2d')
    if (!context) return

    const renderTask = page.render({ canvasContext: context, viewport })
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

  const openFile = useCallback(async () => {
    const result = await window.electronAPI.openFile()
    if (!result) return

    setIsLoading(true)
    try {
      cancelRenderTask(renderTaskRef)
      if (pdfDocRef.current) {
        pdfDocRef.current.destroy()
        pdfDocRef.current = null
      }

      const bytes = await window.electronAPI.readPdfFile(result.path)
      const pdfDoc = await pdfjs.getDocument({ data: bytes }).promise

      pdfDocRef.current = pdfDoc
      setFileName(result.name)
      setFilePath(result.path)
      setTotalPages(pdfDoc.numPages)
      setCurrentPage(1)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`PDF를 열 수 없습니다: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    canvasRef,
    openFile,
    nextPage,
    prevPage
  }
}
