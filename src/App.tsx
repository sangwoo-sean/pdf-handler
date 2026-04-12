import { useState } from 'react'
import { useFileList } from './hooks/useFileList'
import { usePdfViewer } from './hooks/usePdfViewer'
import { ViewerNav, type ViewType } from './components/ViewerNav'
import { AddFileButton } from './components/AddFileButton'
import { FileList } from './components/FileList'
import { MergeButton } from './components/MergeButton'
import { PdfViewer } from './components/PdfViewer'
import styles from './styles/App.module.css'

export function App() {
  const [view, setView] = useState<ViewType>('merge')

  const { files, isMerging, totalPages, addFiles, removeFile, moveUp, moveDown, merge } =
    useFileList()

  const pdfViewer = usePdfViewer()

  return (
    <div className={styles.container}>
      <ViewerNav activeView={view} onChangeView={setView} />

      {view === 'merge' && (
        <>
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
        </>
      )}

      {view === 'viewer' && (
        <PdfViewer
          fileName={pdfViewer.fileName}
          isLoading={pdfViewer.isLoading}
          currentPage={pdfViewer.currentPage}
          totalPages={pdfViewer.totalPages}
          canvasRef={pdfViewer.canvasRef}
          openFile={pdfViewer.openFile}
          nextPage={pdfViewer.nextPage}
          prevPage={pdfViewer.prevPage}
        />
      )}
    </div>
  )
}
