import type { Rect } from '../types/image-overlay'

const RENDER_SCALE = 1.5

/**
 * 디스플레이 좌표(CSS 픽셀, 좌상단 원점)를 PDF 좌표(72 DPI, 좌하단 원점)로 변환
 */
export function displayToPdf(
  display: Rect,
  canvas: HTMLCanvasElement
): Rect {
  const cssScale = canvas.width / canvas.clientWidth
  const pdfPageHeight = canvas.height / RENDER_SCALE

  const pdfWidth = (display.width * cssScale) / RENDER_SCALE
  const pdfHeight = (display.height * cssScale) / RENDER_SCALE
  const pdfX = (display.x * cssScale) / RENDER_SCALE
  const pdfY = pdfPageHeight - (display.y * cssScale) / RENDER_SCALE - pdfHeight

  return { x: pdfX, y: pdfY, width: pdfWidth, height: pdfHeight }
}

/**
 * PDF 좌표(72 DPI, 좌하단 원점)를 디스플레이 좌표(CSS 픽셀, 좌상단 원점)로 변환
 */
export function pdfToDisplay(
  pdf: Rect,
  canvas: HTMLCanvasElement
): Rect {
  const cssScale = canvas.width / canvas.clientWidth
  const pdfPageHeight = canvas.height / RENDER_SCALE

  const displayWidth = (pdf.width * RENDER_SCALE) / cssScale
  const displayHeight = (pdf.height * RENDER_SCALE) / cssScale
  const displayX = (pdf.x * RENDER_SCALE) / cssScale
  const displayY = ((pdfPageHeight - pdf.y - pdf.height) * RENDER_SCALE) / cssScale

  return { x: displayX, y: displayY, width: displayWidth, height: displayHeight }
}

export { RENDER_SCALE }
