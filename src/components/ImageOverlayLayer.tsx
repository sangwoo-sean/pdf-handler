import { useCallback, useEffect, useState } from 'react'
import type { ImageOverlay } from '../types/image-overlay'
import { DraggableImage } from './DraggableImage'
import styles from '../styles/components/ImageOverlayLayer.module.css'

interface ImageOverlayLayerProps {
  readonly overlays: readonly ImageOverlay[]
  readonly canvas: HTMLCanvasElement
  readonly onUpdate: (
    id: string,
    patch: Partial<Pick<ImageOverlay, 'x' | 'y' | 'width' | 'height' | 'rotation'>>
  ) => void
  readonly onRemove: (id: string) => void
}

export function ImageOverlayLayer({
  overlays,
  canvas,
  onUpdate,
  onRemove
}: ImageOverlayLayerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const handleLayerClick = useCallback(() => {
    setSelectedId(null)
  }, [])

  useEffect(() => {
    if (!selectedId) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const STEP = 1
      let dx = 0
      let dy = 0
      switch (e.key) {
        case 'ArrowLeft':  dx = -STEP; break
        case 'ArrowRight': dx = STEP;  break
        case 'ArrowUp':    dy = STEP;  break
        case 'ArrowDown':  dy = -STEP; break
        default: return
      }
      e.preventDefault()
      const overlay = overlays.find((o) => o.id === selectedId)
      if (overlay) {
        onUpdate(selectedId, { x: overlay.x + dx, y: overlay.y + dy })
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, overlays, onUpdate])

  return (
    <div className={styles.layer} onClick={handleLayerClick}>
      {overlays.map((overlay) => (
        <DraggableImage
          key={overlay.id}
          overlay={overlay}
          canvas={canvas}
          isSelected={selectedId === overlay.id}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onSelect={setSelectedId}
        />
      ))}
    </div>
  )
}
