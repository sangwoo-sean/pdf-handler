import styles from '../styles/components/ViewerLauncher.module.css'

export function ViewerLauncher() {
  const handleOpen = () => {
    window.electronAPI.openViewer()
  }

  return (
    <div className={styles.launcher}>
      <button className={styles.openButton} onClick={handleOpen} type="button">
        PDF 파일 열기
      </button>
      <p className={styles.description}>
        파일을 선택하면 새 창에서 PDF를 볼 수 있습니다
      </p>
    </div>
  )
}
