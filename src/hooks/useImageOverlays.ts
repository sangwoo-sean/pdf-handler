import { useCallback, useState } from 'react'
import type { ImageMimeType, ImageOverlay, SerializedOverlay } from '../types/image-overlay'

export interface UseImageOverlaysReturn {
  readonly overlays: readonly ImageOverlay[]
  readonly addOverlay: (
    pageNumber: number,
    dataUrl: string,
    bytes: Uint8Array,
    mimeType: ImageMimeType,
    pdfPageWidth: number,
    pdfPageHeight: number
  ) => void
  readonly updateOverlay: (
    id: string,
    patch: Partial<Pick<ImageOverlay, 'x' | 'y' | 'width' | 'height'>>
  ) => void
  readonly removeOverlay: (id: string) => void
  readonly getOverlaysForPage: (pageNumber: number) => readonly ImageOverlay[]
  readonly clearAllOverlays: () => void
  readonly serializeOverlays: () => readonly SerializedOverlay[]
}

const DEFAULT_IMAGE_SIZE = 100

function createOverlay(
  pageNumber: number,
  dataUrl: string,
  bytes: Uint8Array,
  mimeType: ImageMimeType,
  pdfPageWidth: number,
  pdfPageHeight: number
): ImageOverlay {
  const size = Math.min(DEFAULT_IMAGE_SIZE, pdfPageWidth / 3, pdfPageHeight / 3)
  return {
    id: crypto.randomUUID(),
    pageNumber,
    x: (pdfPageWidth - size) / 2,
    y: (pdfPageHeight - size) / 2,
    width: size,
    height: size,
    dataUrl,
    bytes,
    mimeType
  }
}

export function useImageOverlays(): UseImageOverlaysReturn {
  const [overlays, setOverlays] = useState<readonly ImageOverlay[]>([])

  const addOverlay = useCallback(
    (
      pageNumber: number,
      dataUrl: string,
      bytes: Uint8Array,
      mimeType: ImageMimeType,
      pdfPageWidth: number,
      pdfPageHeight: number
    ) => {
      const overlay = createOverlay(pageNumber, dataUrl, bytes, mimeType, pdfPageWidth, pdfPageHeight)
      setOverlays((prev) => [...prev, overlay])
    },
    []
  )

  const updateOverlay = useCallback(
    (id: string, patch: Partial<Pick<ImageOverlay, 'x' | 'y' | 'width' | 'height'>>) => {
      setOverlays((prev) =>
        prev.map((overlay) =>
          overlay.id === id ? { ...overlay, ...patch } : overlay
        )
      )
    },
    []
  )

  const removeOverlay = useCallback((id: string) => {
    setOverlays((prev) => prev.filter((overlay) => overlay.id !== id))
  }, [])

  const getOverlaysForPage = useCallback(
    (pageNumber: number) => overlays.filter((o) => o.pageNumber === pageNumber),
    [overlays]
  )

  const clearAllOverlays = useCallback(() => {
    setOverlays([])
  }, [])

  const serializeOverlays = useCallback(
    (): readonly SerializedOverlay[] =>
      overlays.map(({ pageNumber, x, y, width, height, bytes, mimeType }) => ({
        pageNumber,
        x,
        y,
        width,
        height,
        bytes,
        mimeType
      })),
    [overlays]
  )

  return {
    overlays,
    addOverlay,
    updateOverlay,
    removeOverlay,
    getOverlaysForPage,
    clearAllOverlays,
    serializeOverlays
  }
}
