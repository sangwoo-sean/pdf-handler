import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useImageOverlays } from '../src/hooks/useImageOverlays'

beforeEach(() => {
  vi.stubGlobal('crypto', {
    randomUUID: vi.fn().mockReturnValueOnce('uuid-1').mockReturnValueOnce('uuid-2').mockReturnValue('uuid-3')
  })
})

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47])

describe('useImageOverlays', () => {
  it('should start with empty overlays', () => {
    const { result } = renderHook(() => useImageOverlays())
    expect(result.current.overlays).toEqual([])
  })

  it('should add an overlay centered on the page', () => {
    const { result } = renderHook(() => useImageOverlays())

    act(() => {
      result.current.addOverlay(1, 'data:image/png;base64,...', PNG_BYTES, 'image/png', 612, 792)
    })

    expect(result.current.overlays).toHaveLength(1)
    const overlay = result.current.overlays[0]
    expect(overlay.id).toBe('uuid-1')
    expect(overlay.pageNumber).toBe(1)
    expect(overlay.mimeType).toBe('image/png')
    // centered: (612 - 100) / 2 = 256
    expect(overlay.x).toBeCloseTo(256, 0)
    expect(overlay.y).toBeCloseTo(346, 0)
  })

  it('should update overlay position immutably', () => {
    const { result } = renderHook(() => useImageOverlays())

    act(() => {
      result.current.addOverlay(1, 'url', PNG_BYTES, 'image/png', 612, 792)
    })

    const before = result.current.overlays
    act(() => {
      result.current.updateOverlay('uuid-1', { x: 50, y: 100 })
    })

    expect(result.current.overlays).not.toBe(before)
    expect(result.current.overlays[0].x).toBe(50)
    expect(result.current.overlays[0].y).toBe(100)
    // width/height unchanged
    expect(result.current.overlays[0].width).toBe(before[0].width)
  })

  it('should remove an overlay', () => {
    const { result } = renderHook(() => useImageOverlays())

    act(() => {
      result.current.addOverlay(1, 'url1', PNG_BYTES, 'image/png', 612, 792)
      result.current.addOverlay(2, 'url2', PNG_BYTES, 'image/png', 612, 792)
    })

    act(() => {
      result.current.removeOverlay('uuid-1')
    })

    expect(result.current.overlays).toHaveLength(1)
    expect(result.current.overlays[0].id).toBe('uuid-2')
  })

  it('should filter overlays by page number', () => {
    const { result } = renderHook(() => useImageOverlays())

    act(() => {
      result.current.addOverlay(1, 'url1', PNG_BYTES, 'image/png', 612, 792)
      result.current.addOverlay(2, 'url2', PNG_BYTES, 'image/png', 612, 792)
      result.current.addOverlay(1, 'url3', PNG_BYTES, 'image/png', 612, 792)
    })

    const page1 = result.current.getOverlaysForPage(1)
    expect(page1).toHaveLength(2)
    expect(page1.every((o) => o.pageNumber === 1)).toBe(true)

    const page2 = result.current.getOverlaysForPage(2)
    expect(page2).toHaveLength(1)
  })

  it('should clear all overlays', () => {
    const { result } = renderHook(() => useImageOverlays())

    act(() => {
      result.current.addOverlay(1, 'url1', PNG_BYTES, 'image/png', 612, 792)
      result.current.addOverlay(2, 'url2', PNG_BYTES, 'image/png', 612, 792)
    })

    act(() => {
      result.current.clearAllOverlays()
    })

    expect(result.current.overlays).toHaveLength(0)
  })

  it('should serialize overlays without dataUrl', () => {
    const { result } = renderHook(() => useImageOverlays())

    act(() => {
      result.current.addOverlay(1, 'url1', PNG_BYTES, 'image/png', 612, 792)
    })

    const serialized = result.current.serializeOverlays()
    expect(serialized).toHaveLength(1)
    expect(serialized[0]).not.toHaveProperty('dataUrl')
    expect(serialized[0]).not.toHaveProperty('id')
    expect(serialized[0].bytes).toEqual(PNG_BYTES)
    expect(serialized[0].pageNumber).toBe(1)
  })
})
