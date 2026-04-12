import styles from '../styles/components/MergeButton.module.css'

interface MergeButtonProps {
  readonly disabled: boolean
  readonly isMerging: boolean
  readonly onMerge: () => void
}

export function MergeButton({ disabled, isMerging, onMerge }: MergeButtonProps) {
  return (
    <button
      className={styles.button}
      disabled={disabled || isMerging}
      onClick={onMerge}
      type="button"
    >
      {isMerging ? '병합 중...' : 'PDF 병합하기'}
    </button>
  )
}
