import type { ImageOverlay } from '../types/image-overlay'
import type { UsePdfViewerReturn } from '../hooks/usePdfViewer'
import { ImageOverlayLayer } from './ImageOverlayLayer'
import styles from '../styles/components/PdfViewer.module.css'

interface PdfViewerProps extends Omit<UsePdfViewerReturn, 'filePath' | 'pdfPageSize'> {
  readonly overlays: readonly ImageOverlay[]
  readonly onUpdateOverlay: (
    id: string,
    patch: Partial<Pick<ImageOverlay, 'x' | 'y' | 'width' | 'height' | 'rotation'>>
  ) => void
  readonly onRemoveOverlay: (id: string) => void
  readonly onInsertImage: () => void
  readonly onSave: () => void
  readonly canSave: boolean
}

export function PdfViewer({
  fileName,
  isLoading,
  currentPage,
  totalPages,
  canvasRef,
  openFile,
  nextPage,
  prevPage,
  overlays,
  onUpdateOverlay,
  onRemoveOverlay,
  onInsertImage,
  onSave,
  canSave
}: PdfViewerProps) {
  return (
    <div className={styles.viewer}>
      <div className={styles.toolbar}>
        <button className={styles.openButton} onClick={openFile} type="button">
          {fileName ? '다른 파일 열기' : '파일 열기'}
        </button>
        {fileName && !isLoading && (
          <>
            <button
              className={styles.insertButton}
              onClick={onInsertImage}
              type="button"
            >
              이미지 삽입
            </button>
            <button
              className={styles.saveButton}
              onClick={onSave}
              disabled={!canSave}
              type="button"
            >
              저장
            </button>
          </>
        )}
      </div>

      {isLoading && <p className={styles.loading}>로딩 중...</p>}

      {/* 캔버스는 항상 DOM에 유지 (ref 안정성 보장) */}
      <div
        className={styles.canvasContainer}
        style={{ display: fileName && !isLoading ? undefined : 'none' }}
      >
        <div className={styles.canvasWrapper}>
          <canvas ref={canvasRef} className={styles.canvas} />
          {canvasRef.current && overlays.length > 0 && (
            <ImageOverlayLayer
              overlays={overlays}
              canvas={canvasRef.current}
              onUpdate={onUpdateOverlay}
              onRemove={onRemoveOverlay}
            />
          )}
        </div>
      </div>

      {fileName && !isLoading && (
        <div className={styles.navigation}>
          <button
            className={styles.navButton}
            disabled={currentPage <= 1}
            onClick={prevPage}
            type="button"
          >
            ◀ 이전
          </button>
          <span className={styles.pageInfo}>
            {currentPage} / {totalPages}
          </span>
          <button
            className={styles.navButton}
            disabled={currentPage >= totalPages}
            onClick={nextPage}
            type="button"
          >
            다음 ▶
          </button>
        </div>
      )}

      {!fileName && !isLoading && (
        <p className={styles.placeholder}>PDF 파일을 열어주세요</p>
      )}
    </div>
  )
}
