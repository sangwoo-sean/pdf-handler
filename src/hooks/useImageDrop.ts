import { useCallback, useEffect, useState } from 'react'
import { readFileAsBytes } from '../utils/image'

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg']

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return IMAGE_EXTENSIONS.includes(ext)
}

function getImageMimeType(file: File): string {
  if (file.type === 'image/png') return 'image/png'
  return 'image/jpeg'
}

export interface UseImageDropReturn {
  readonly isDragOver: boolean
}

export function useImageDrop(
  targetRef: React.RefObject<HTMLElement | null>,
  onImage: (bytes: Uint8Array, mimeType: string) => void,
  enabled: boolean
): UseImageDropReturn {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      if (!enabled) return
      e.preventDefault()
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy'
      }
      setIsDragOver(true)
    },
    [enabled]
  )

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      const target = targetRef.current
      if (!target) return
      const related = e.relatedTarget as Node | null
      if (related && target.contains(related)) return
      setIsDragOver(false)
    },
    [targetRef]
  )

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (!enabled) return

      const files = e.dataTransfer?.files
      if (!files || files.length === 0) return

      const file = files[0]
      if (!isImageFile(file)) return

      const bytes = await readFileAsBytes(file)
      const mimeType = getImageMimeType(file)
      onImage(bytes, mimeType)
    },
    [enabled, onImage]
  )

  useEffect(() => {
    const target = targetRef.current
    if (!target) return

    target.addEventListener('dragover', handleDragOver)
    target.addEventListener('dragleave', handleDragLeave)
    target.addEventListener('drop', handleDrop)

    return () => {
      target.removeEventListener('dragover', handleDragOver)
      target.removeEventListener('dragleave', handleDragLeave)
      target.removeEventListener('drop', handleDrop)
    }
  }, [targetRef, handleDragOver, handleDragLeave, handleDrop])

  return { isDragOver }
}
