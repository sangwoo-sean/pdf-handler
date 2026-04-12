import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFileList } from '../src/hooks/useFileList'

const mockOpenFiles = vi.fn()
const mockMergePdfs = vi.fn()

beforeEach(() => {
  vi.stubGlobal('window', {
    ...window,
    electronAPI: {
      openFiles: mockOpenFiles,
      mergePdfs: mockMergePdfs
    }
  })
  mockOpenFiles.mockReset()
  mockMergePdfs.mockReset()
})

describe('useFileList', () => {
  it('starts with empty file list', () => {
    const { result } = renderHook(() => useFileList())
    expect(result.current.files).toEqual([])
    expect(result.current.totalPages).toBe(0)
    expect(result.current.isMerging).toBe(false)
  })

  it('adds files from dialog', async () => {
    mockOpenFiles.mockResolvedValue([
      { name: 'a.pdf', path: '/a.pdf', pageCount: 2 },
      { name: 'b.pdf', path: '/b.pdf', pageCount: 3 }
    ])

    const { result } = renderHook(() => useFileList())

    await act(async () => {
      await result.current.addFiles()
    })

    expect(result.current.files).toHaveLength(2)
    expect(result.current.files[0].name).toBe('a.pdf')
    expect(result.current.files[1].name).toBe('b.pdf')
    expect(result.current.totalPages).toBe(5)
  })

  it('does not add files when dialog is cancelled', async () => {
    mockOpenFiles.mockResolvedValue([])

    const { result } = renderHook(() => useFileList())

    await act(async () => {
      await result.current.addFiles()
    })

    expect(result.current.files).toHaveLength(0)
  })

  it('removes a file by id', async () => {
    mockOpenFiles.mockResolvedValue([
      { name: 'a.pdf', path: '/a.pdf', pageCount: 1 },
      { name: 'b.pdf', path: '/b.pdf', pageCount: 2 }
    ])

    const { result } = renderHook(() => useFileList())

    await act(async () => {
      await result.current.addFiles()
    })

    const idToRemove = result.current.files[0].id

    act(() => {
      result.current.removeFile(idToRemove)
    })

    expect(result.current.files).toHaveLength(1)
    expect(result.current.files[0].name).toBe('b.pdf')
  })

  it('moves a file up', async () => {
    mockOpenFiles.mockResolvedValue([
      { name: 'a.pdf', path: '/a.pdf', pageCount: 1 },
      { name: 'b.pdf', path: '/b.pdf', pageCount: 2 }
    ])

    const { result } = renderHook(() => useFileList())

    await act(async () => {
      await result.current.addFiles()
    })

    const secondFileId = result.current.files[1].id

    act(() => {
      result.current.moveUp(secondFileId)
    })

    expect(result.current.files[0].name).toBe('b.pdf')
    expect(result.current.files[1].name).toBe('a.pdf')
  })

  it('does not move the first file up', async () => {
    mockOpenFiles.mockResolvedValue([
      { name: 'a.pdf', path: '/a.pdf', pageCount: 1 },
      { name: 'b.pdf', path: '/b.pdf', pageCount: 2 }
    ])

    const { result } = renderHook(() => useFileList())

    await act(async () => {
      await result.current.addFiles()
    })

    const firstFileId = result.current.files[0].id

    act(() => {
      result.current.moveUp(firstFileId)
    })

    expect(result.current.files[0].name).toBe('a.pdf')
  })

  it('moves a file down', async () => {
    mockOpenFiles.mockResolvedValue([
      { name: 'a.pdf', path: '/a.pdf', pageCount: 1 },
      { name: 'b.pdf', path: '/b.pdf', pageCount: 2 }
    ])

    const { result } = renderHook(() => useFileList())

    await act(async () => {
      await result.current.addFiles()
    })

    const firstFileId = result.current.files[0].id

    act(() => {
      result.current.moveDown(firstFileId)
    })

    expect(result.current.files[0].name).toBe('b.pdf')
    expect(result.current.files[1].name).toBe('a.pdf')
  })

  it('does not move the last file down', async () => {
    mockOpenFiles.mockResolvedValue([
      { name: 'a.pdf', path: '/a.pdf', pageCount: 1 },
      { name: 'b.pdf', path: '/b.pdf', pageCount: 2 }
    ])

    const { result } = renderHook(() => useFileList())

    await act(async () => {
      await result.current.addFiles()
    })

    const lastFileId = result.current.files[1].id

    act(() => {
      result.current.moveDown(lastFileId)
    })

    expect(result.current.files[1].name).toBe('b.pdf')
  })
})
