import { useEffect } from 'react'
import { readFileAsBytes } from '../utils/image'

const IMAGE_TYPES = ['image/png', 'image/jpeg']

export function useImagePaste(
  onImage: (bytes: Uint8Array, mimeType: string) => void,
  enabled: boolean
): void {
  useEffect(() => {
    if (!enabled) return

    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return

      for (const item of items) {
        if (!IMAGE_TYPES.includes(item.type)) continue

        const file = item.getAsFile()
        if (!file) continue

        e.preventDefault()
        const bytes = await readFileAsBytes(file)
        onImage(bytes, item.type)
        return
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onImage, enabled])
}
