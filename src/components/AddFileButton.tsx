import styles from '../styles/components/AddFileButton.module.css'

interface AddFileButtonProps {
  readonly onAdd: () => void
}

export function AddFileButton({ onAdd }: AddFileButtonProps) {
  return (
    <button className={styles.button} onClick={onAdd} type="button">
      + 파일 추가
    </button>
  )
}
