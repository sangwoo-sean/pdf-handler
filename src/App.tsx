import { useFileList } from './hooks/useFileList'
import { AddFileButton } from './components/AddFileButton'
import { FileList } from './components/FileList'
import { MergeButton } from './components/MergeButton'
import styles from './styles/App.module.css'

export function App() {
  const { files, isMerging, totalPages, addFiles, removeFile, moveUp, moveDown, merge } =
    useFileList()

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>PDF Merger</h1>

      <AddFileButton onAdd={addFiles} />

      <FileList
        files={files}
        onMoveUp={moveUp}
        onMoveDown={moveDown}
        onRemove={removeFile}
      />

      {files.length > 0 && (
        <p className={styles.summary}>
          총 {totalPages} 페이지
        </p>
      )}

      <MergeButton
        disabled={files.length < 2}
        isMerging={isMerging}
        onMerge={merge}
      />
    </div>
  )
}
