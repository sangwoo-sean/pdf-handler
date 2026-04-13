import { useState } from 'react'
import { useFileList } from './hooks/useFileList'
import { usePdfViewer } from './hooks/usePdfViewer'
import { ViewerNav, type ViewType } from './components/ViewerNav'
import { AddFileButton } from './components/AddFileButton'
import { FileList } from './components/FileList'
import { MergeButton } from './components/MergeButton'
import { PdfViewer } from './components/PdfViewer'
import { ViewerLauncher } from './components/ViewerLauncher'
import styles from './styles/App.module.css'

const isViewerWindow = window.location.hash === '#viewer'

function MainApp() {
  const [view, setView] = useState<ViewType>('merge')

  const { files, isMerging, totalPages, addFiles, removeFile, moveUp, moveDown, merge } =
    useFileList()

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

      {view === 'viewer' && <ViewerLauncher />}
    </div>
  )
}

function ViewerApp() {
  const pdfViewer = usePdfViewer({ autoOpen: true })

  return (
    <div className={styles.viewerContainer}>
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
    </div>
  )
}

export function App() {
  return isViewerWindow ? <ViewerApp /> : <MainApp />
}
