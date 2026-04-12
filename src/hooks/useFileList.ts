import { useCallback, useState } from 'react'
import type { PdfFile } from '../types'

interface UseFileListReturn {
  readonly files: readonly PdfFile[]
  readonly isMerging: boolean
  readonly totalPages: number
  readonly addFiles: () => Promise<void>
  readonly removeFile: (id: string) => void
  readonly moveUp: (id: string) => void
  readonly moveDown: (id: string) => void
  readonly merge: () => Promise<void>
}

export function useFileList(): UseFileListReturn {
  const [files, setFiles] = useState<PdfFile[]>([])
  const [isMerging, setIsMerging] = useState(false)

  const totalPages = files.reduce((sum, f) => sum + f.pageCount, 0)

  const addFiles = useCallback(async () => {
    const results = await window.electronAPI.openFiles()
    if (results.length === 0) return

    const newFiles: PdfFile[] = results.map((r) => ({
      id: crypto.randomUUID(),
      name: r.name,
      path: r.path,
      pageCount: r.pageCount
    }))

    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const moveUp = useCallback((id: string) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id)
      if (index <= 0) return prev
      const next = [...prev]
      const temp = next[index - 1]
      next[index - 1] = next[index]
      next[index] = temp
      return next
    })
  }, [])

  const moveDown = useCallback((id: string) => {
    setFiles((prev) => {
      const index = prev.findIndex((f) => f.id === id)
      if (index < 0 || index >= prev.length - 1) return prev
      const next = [...prev]
      const temp = next[index + 1]
      next[index + 1] = next[index]
      next[index] = temp
      return next
    })
  }, [])

  const merge = useCallback(async () => {
    if (files.length < 2) return

    setIsMerging(true)
    try {
      const filePaths = files.map((f) => f.path)
      const result = await window.electronAPI.mergePdfs(filePaths)

      if (result.success) {
        alert('PDF 병합이 완료되었습니다.')
      } else if (result.error !== 'cancelled') {
        alert(`병합 실패: ${result.error}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert(`병합 중 오류가 발생했습니다: ${message}`)
    } finally {
      setIsMerging(false)
    }
  }, [files])

  return { files, isMerging, totalPages, addFiles, removeFile, moveUp, moveDown, merge }
}
