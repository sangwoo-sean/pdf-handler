import styles from '../styles/components/ViewerNav.module.css'

export type ViewType = 'merge' | 'viewer'

interface ViewerNavProps {
  readonly activeView: ViewType
  readonly onChangeView: (view: ViewType) => void
}

export function ViewerNav({ activeView, onChangeView }: ViewerNavProps) {
  return (
    <nav className={styles.nav}>
      <button
        className={`${styles.tab} ${activeView === 'merge' ? styles.active : ''}`}
        onClick={() => onChangeView('merge')}
        type="button"
      >
        PDF 병합
      </button>
      <button
        className={`${styles.tab} ${activeView === 'viewer' ? styles.active : ''}`}
        onClick={() => onChangeView('viewer')}
        type="button"
      >
        PDF 뷰어
      </button>
    </nav>
  )
}
