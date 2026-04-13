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
    pdfPageHeight: number,
    imageNaturalWidth: number,
    imageNaturalHeight: number
  ) => void
  readonly updateOverlay: (
    id: string,
    patch: Partial<Pick<ImageOverlay, 'x' | 'y' | 'width' | 'height' | 'rotation'>>
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
  pdfPageHeight: number,
  imageNaturalWidth: number,
  imageNaturalHeight: number
): ImageOverlay {
  const maxSize = Math.min(DEFAULT_IMAGE_SIZE, pdfPageWidth / 3, pdfPageHeight / 3)
  const aspectRatio = imageNaturalWidth / imageNaturalHeight
  const width = aspectRatio >= 1 ? maxSize : maxSize * aspectRatio
  const height = aspectRatio >= 1 ? maxSize / aspectRatio : maxSize

  return {
    id: crypto.randomUUID(),
    pageNumber,
    x: (pdfPageWidth - width) / 2,
    y: (pdfPageHeight - height) / 2,
    width,
    height,
    rotation: 0,
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
      pdfPageHeight: number,
      imageNaturalWidth: number,
      imageNaturalHeight: number
    ) => {
      const overlay = createOverlay(
        pageNumber, dataUrl, bytes, mimeType,
        pdfPageWidth, pdfPageHeight,
        imageNaturalWidth, imageNaturalHeight
      )
      setOverlays((prev) => [...prev, overlay])
    },
    []
  )

  const updateOverlay = useCallback(
    (id: string, patch: Partial<Pick<ImageOverlay, 'x' | 'y' | 'width' | 'height' | 'rotation'>>) => {
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
      overlays.map(({ pageNumber, x, y, width, height, rotation, bytes, mimeType }) => ({
        pageNumber,
        x,
        y,
        width,
        height,
        rotation,
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
