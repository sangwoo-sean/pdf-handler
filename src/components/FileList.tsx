import type { PdfFile } from '../types'
import { FileItem } from './FileItem'
import styles from '../styles/components/FileList.module.css'

interface FileListProps {
  readonly files: readonly PdfFile[]
  readonly onMoveUp: (id: string) => void
  readonly onMoveDown: (id: string) => void
  readonly onRemove: (id: string) => void
}

export function FileList({ files, onMoveUp, onMoveDown, onRemove }: FileListProps) {
  if (files.length === 0) {
    return (
      <div className={styles.empty}>
        PDF 파일을 추가해주세요
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {files.map((file, index) => (
        <FileItem
          key={file.id}
          file={file}
          index={index}
          isFirst={index === 0}
          isLast={index === files.length - 1}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onRemove={onRemove}
        />
      ))}
    </div>
  )
}
