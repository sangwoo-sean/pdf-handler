import { useCallback, useRef, useState } from 'react'
import { useFileList } from './hooks/useFileList'
import { usePdfViewer } from './hooks/usePdfViewer'
import { useImageOverlays } from './hooks/useImageOverlays'
import { useImagePaste } from './hooks/useImagePaste'
import { useImageDrop } from './hooks/useImageDrop'
import { ViewerNav, type ViewType } from './components/ViewerNav'
import { AddFileButton } from './components/AddFileButton'
import { FileList } from './components/FileList'
import { MergeButton } from './components/MergeButton'
import { PdfViewer } from './components/PdfViewer'
import { ViewerLauncher } from './components/ViewerLauncher'
import { bytesToDataUrl, loadImageSize } from './utils/image'
import type { ImageMimeType } from './types/image-overlay'
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
  const imageOverlays = useImageOverlays()
  const canvasWrapperRef = useRef<HTMLDivElement | null>(null)

  const currentPageOverlays = imageOverlays.getOverlaysForPage(pdfViewer.currentPage)

  const handleImageBytes = useCallback(
    async (bytes: Uint8Array, mimeType: string) => {
      if (!pdfViewer.pdfPageSize) return

      const dataUrl = bytesToDataUrl(bytes, mimeType)
      const { width: naturalWidth, height: naturalHeight } = await loadImageSize(dataUrl)

      imageOverlays.addOverlay(
        pdfViewer.currentPage,
        dataUrl,
        bytes,
        mimeType as ImageMimeType,
        pdfViewer.pdfPageSize.width,
        pdfViewer.pdfPageSize.height,
        naturalWidth,
        naturalHeight
      )
    },
    [pdfViewer.currentPage, pdfViewer.pdfPageSize, imageOverlays.addOverlay]
  )

  const handleInsertImage = useCallback(async () => {
    const result = await window.electronAPI.openImage()
    if (!result) return
    await handleImageBytes(result.bytes, result.mimeType)
  }, [handleImageBytes])

  const isPdfLoaded = !!pdfViewer.fileName && !pdfViewer.isLoading

  useImagePaste(handleImageBytes, isPdfLoaded)
  const { isDragOver } = useImageDrop(canvasWrapperRef, handleImageBytes, isPdfLoaded)

  const handleSave = useCallback(async () => {
    if (!pdfViewer.filePath) return

    const serialized = imageOverlays.serializeOverlays()
    if (serialized.length === 0) return

    const result = await window.electronAPI.savePdfWithImages({
      sourcePath: pdfViewer.filePath,
      overlays: serialized.map((o) => ({
        pageNumber: o.pageNumber,
        x: o.x,
        y: o.y,
        width: o.width,
        height: o.height,
        rotation: o.rotation,
        bytes: o.bytes,
        mimeType: o.mimeType
      }))
    })

    if (result.success) {
      alert('PDF가 저장되었습니다.')
    } else if (result.error !== 'cancelled') {
      alert(`저장 실패: ${result.error}`)
    }
  }, [pdfViewer.filePath, imageOverlays.serializeOverlays])

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
        overlays={currentPageOverlays}
        onUpdateOverlay={imageOverlays.updateOverlay}
        onRemoveOverlay={imageOverlays.removeOverlay}
        onInsertImage={handleInsertImage}
        onSave={handleSave}
        canSave={imageOverlays.overlays.length > 0}
        canvasWrapperRef={canvasWrapperRef}
        isDragOver={isDragOver}
      />
    </div>
  )
}

export function App() {
  return isViewerWindow ? <ViewerApp /> : <MainApp />
}
