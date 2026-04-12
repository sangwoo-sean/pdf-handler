import type { PdfFile } from '../types'
import styles from '../styles/components/FileItem.module.css'

interface FileItemProps {
  readonly file: PdfFile
  readonly index: number
  readonly isFirst: boolean
  readonly isLast: boolean
  readonly onMoveUp: (id: string) => void
  readonly onMoveDown: (id: string) => void
  readonly onRemove: (id: string) => void
}

export function FileItem({
  file,
  index,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onRemove
}: FileItemProps) {
  return (
    <div className={styles.item}>
      <span className={styles.index}>{index + 1}.</span>
      <span className={styles.name} title={file.path}>
        {file.name}
      </span>
      <span className={styles.pages}>{file.pageCount}p</span>
      <div className={styles.actions}>
        <button
          className={styles.actionButton}
          disabled={isFirst}
          onClick={() => onMoveUp(file.id)}
          title="위로 이동"
          type="button"
        >
          ▲
        </button>
        <button
          className={styles.actionButton}
          disabled={isLast}
          onClick={() => onMoveDown(file.id)}
          title="아래로 이동"
          type="button"
        >
          ▼
        </button>
        <button
          className={styles.removeButton}
          onClick={() => onRemove(file.id)}
          title="삭제"
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
