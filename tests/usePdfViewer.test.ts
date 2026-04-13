import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { usePdfViewer } from '../src/hooks/usePdfViewer'

let mockNumPages = 5

vi.mock('pdfjs-dist/legacy/build/pdf.mjs', () => {
  const mockPage = {
    getViewport: () => ({ width: 300, height: 400 }),
    render: () => ({
      promise: Promise.resolve(),
      cancel: vi.fn()
    })
  }

  return {
    GlobalWorkerOptions: { workerSrc: '' },
    getDocument: vi.fn().mockImplementation(() => ({
      promise: Promise.resolve({
        numPages: mockNumPages,
        getPage: vi.fn().mockResolvedValue(mockPage),
        destroy: vi.fn()
      })
    }))
  }
})

const mockOpenFile = vi.fn()
const mockReadPdfFile = vi.fn()

beforeEach(() => {
  mockNumPages = 5
  vi.stubGlobal('window', {
    ...window,
    electronAPI: {
      openFiles: vi.fn(),
      openFile: mockOpenFile,
      readPdfFile: mockReadPdfFile,
      mergePdfs: vi.fn()
    }
  })
  mockOpenFile.mockReset()
  mockReadPdfFile.mockReset()
})

describe('usePdfViewer', () => {
  it('starts with no file loaded', () => {
    const { result } = renderHook(() => usePdfViewer())
    expect(result.current.fileName).toBeNull()
    expect(result.current.filePath).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.currentPage).toBe(0)
    expect(result.current.totalPages).toBe(0)
  })

  it('loads a PDF file via openFile', async () => {
    mockOpenFile.mockResolvedValue({
      name: 'test.pdf',
      path: '/test.pdf',
      pageCount: 5
    })
    mockReadPdfFile.mockResolvedValue(new Uint8Array([1, 2, 3]))

    const { result } = renderHook(() => usePdfViewer())

    await act(async () => {
      await result.current.openFile()
    })

    expect(result.current.fileName).toBe('test.pdf')
    expect(result.current.filePath).toBe('/test.pdf')
    expect(result.current.totalPages).toBe(5)
    expect(result.current.currentPage).toBe(1)
    expect(result.current.isLoading).toBe(false)
  })

  it('does nothing when dialog is cancelled', async () => {
    mockOpenFile.mockResolvedValue(null)

    const { result } = renderHook(() => usePdfViewer())

    await act(async () => {
      await result.current.openFile()
    })

    expect(result.current.fileName).toBeNull()
    expect(result.current.currentPage).toBe(0)
  })

  it('navigates to next page', async () => {
    mockOpenFile.mockResolvedValue({
      name: 'test.pdf',
      path: '/test.pdf',
      pageCount: 5
    })
    mockReadPdfFile.mockResolvedValue(new Uint8Array([1, 2, 3]))

    const { result } = renderHook(() => usePdfViewer())

    await act(async () => {
      await result.current.openFile()
    })

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(2)
  })

  it('does not go past the last page', async () => {
    mockNumPages = 2
    mockOpenFile.mockResolvedValue({
      name: 'test.pdf',
      path: '/test.pdf',
      pageCount: 2
    })
    mockReadPdfFile.mockResolvedValue(new Uint8Array([1, 2, 3]))

    const { result } = renderHook(() => usePdfViewer())

    await act(async () => {
      await result.current.openFile()
    })

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(2)

    act(() => {
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(2)
  })

  it('navigates to previous page', async () => {
    mockOpenFile.mockResolvedValue({
      name: 'test.pdf',
      path: '/test.pdf',
      pageCount: 5
    })
    mockReadPdfFile.mockResolvedValue(new Uint8Array([1, 2, 3]))

    const { result } = renderHook(() => usePdfViewer())

    await act(async () => {
      await result.current.openFile()
    })

    act(() => {
      result.current.nextPage()
      result.current.nextPage()
    })

    expect(result.current.currentPage).toBe(3)

    act(() => {
      result.current.prevPage()
    })

    expect(result.current.currentPage).toBe(2)
  })

  it('does not go before the first page', async () => {
    mockOpenFile.mockResolvedValue({
      name: 'test.pdf',
      path: '/test.pdf',
      pageCount: 5
    })
    mockReadPdfFile.mockResolvedValue(new Uint8Array([1, 2, 3]))

    const { result } = renderHook(() => usePdfViewer())

    await act(async () => {
      await result.current.openFile()
    })

    act(() => {
      result.current.prevPage()
    })

    expect(result.current.currentPage).toBe(1)
  })
})
