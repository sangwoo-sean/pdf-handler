import { useCallback, useState } from 'react'
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
