import { useCallback, useRef, useState } from 'react'
import type { ImageOverlay } from '../types/image-overlay'
import { pdfToDisplay, displayToPdf } from '../utils/coordinates'
import styles from '../styles/components/DraggableImage.module.css'

interface DraggableImageProps {
  readonly overlay: ImageOverlay
  readonly canvas: HTMLCanvasElement
  readonly isSelected: boolean
  readonly onUpdate: (
    id: string,
    patch: Partial<Pick<ImageOverlay, 'x' | 'y' | 'width' | 'height' | 'rotation'>>
  ) => void
  readonly onRemove: (id: string) => void
  readonly onSelect: (id: string) => void
}

type DragMode = 'move' | 'resize' | 'rotate' | null

const MIN_DISPLAY_SIZE = 20

function calcRotationDeg(
  centerX: number,
  centerY: number,
  mouseX: number,
  mouseY: number
): number {
  const rad = Math.atan2(mouseX - centerX, -(mouseY - centerY))
  return ((rad * 180) / Math.PI + 360) % 360
}

export function DraggableImage({
  overlay,
  canvas,
  isSelected,
  onUpdate,
  onRemove,
  onSelect
}: DraggableImageProps) {
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const startRef = useRef({ mouseX: 0, mouseY: 0, x: 0, y: 0, w: 0, h: 0 })
  const rotateStartRef = useRef({ startAngle: 0, startRotation: 0 })
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const display = pdfToDisplay(overlay, canvas)

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, mode: DragMode) => {
      e.preventDefault()
      e.stopPropagation()
      onSelect(overlay.id)
      setDragMode(mode)

      const currentDisplay = pdfToDisplay(overlay, canvas)
      startRef.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        x: currentDisplay.x,
        y: currentDisplay.y,
        w: currentDisplay.width,
        h: currentDisplay.height
      }

      if (mode === 'rotate' && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        rotateStartRef.current = {
          startAngle: calcRotationDeg(centerX, centerY, e.clientX, e.clientY),
          startRotation: overlay.rotation
        }
      }

      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [overlay, canvas, onSelect]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragMode) return

      const dx = e.clientX - startRef.current.mouseX
      const dy = e.clientY - startRef.current.mouseY
      const { x, y, w, h } = startRef.current

      if (dragMode === 'move') {
        const newDisplay = { x: x + dx, y: y + dy, width: w, height: h }
        const pdfRect = displayToPdf(newDisplay, canvas)
        onUpdate(overlay.id, { x: pdfRect.x, y: pdfRect.y })
      } else if (dragMode === 'resize') {
        const newW = Math.max(MIN_DISPLAY_SIZE, w + dx)
        const newH = Math.max(MIN_DISPLAY_SIZE, h + dy)
        const newDisplay = { x, y, width: newW, height: newH }
        const pdfRect = displayToPdf(newDisplay, canvas)
        onUpdate(overlay.id, { width: pdfRect.width, height: pdfRect.height })
      } else if (dragMode === 'rotate' && wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect()
        const centerX = rect.left + rect.width / 2
        const centerY = rect.top + rect.height / 2
        const currentAngle = calcRotationDeg(centerX, centerY, e.clientX, e.clientY)
        const { startAngle, startRotation } = rotateStartRef.current
        const delta = currentAngle - startAngle
        onUpdate(overlay.id, { rotation: (startRotation + delta + 360) % 360 })
      }
    },
    [dragMode, canvas, overlay.id, onUpdate]
  )

  const handlePointerUp = useCallback(() => {
    setDragMode(null)
  }, [])

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove(overlay.id)
    },
    [overlay.id, onRemove]
  )

  return (
    <div
      ref={wrapperRef}
      className={`${styles.wrapper} ${isSelected ? styles.selected : ''}`}
      style={{
        left: display.x,
        top: display.y,
        width: display.width,
        height: display.height,
        transform: overlay.rotation ? `rotate(${overlay.rotation}deg)` : undefined
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => handlePointerDown(e, 'move')}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <img
        src={overlay.dataUrl}
        alt=""
        className={styles.image}
        draggable={false}
      />

      {isSelected && (
        <>
          <button
            type="button"
            className={styles.removeButton}
            onClick={handleRemove}
          >
            ✕
          </button>
          <div
            className={styles.rotateHandle}
            onPointerDown={(e) => handlePointerDown(e, 'rotate')}
          />
          <div className={styles.rotateLine} />
          <div
            className={styles.resizeHandle}
            onPointerDown={(e) => handlePointerDown(e, 'resize')}
          />
        </>
      )}
    </div>
  )
}
