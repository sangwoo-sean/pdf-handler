import type { UsePdfViewerReturn } from '../hooks/usePdfViewer'
import styles from '../styles/components/PdfViewer.module.css'

type PdfViewerProps = Omit<UsePdfViewerReturn, 'filePath'>

export function PdfViewer({
  fileName,
  isLoading,
  currentPage,
  totalPages,
  canvasRef,
  openFile,
  nextPage,
  prevPage
}: PdfViewerProps) {
  return (
    <div className={styles.viewer}>
      <button className={styles.openButton} onClick={openFile} type="button">
        {fileName ? '다른 파일 열기' : '파일 열기'}
      </button>

      {isLoading && <p className={styles.loading}>로딩 중...</p>}

      {/* 캔버스는 항상 DOM에 유지 (ref 안정성 보장) */}
      <div
        className={styles.canvasContainer}
        style={{ display: fileName && !isLoading ? undefined : 'none' }}
      >
        <canvas ref={canvasRef} className={styles.canvas} />
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
