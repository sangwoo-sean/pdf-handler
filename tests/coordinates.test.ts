import { describe, it, expect } from 'vitest'
import { displayToPdf, pdfToDisplay } from '../src/utils/coordinates'

function createMockCanvas(
  pixelWidth: number,
  pixelHeight: number,
  clientWidth?: number,
  clientHeight?: number
): HTMLCanvasElement {
  return {
    width: pixelWidth,
    height: pixelHeight,
    clientWidth: clientWidth ?? pixelWidth,
    clientHeight: clientHeight ?? pixelHeight
  } as HTMLCanvasElement
}

describe('coordinates', () => {
  describe('displayToPdf / pdfToDisplay roundtrip', () => {
    it('should be inverse operations (no CSS scaling)', () => {
      const canvas = createMockCanvas(900, 1200)
      const display = { x: 100, y: 150, width: 200, height: 80 }

      const pdf = displayToPdf(display, canvas)
      const back = pdfToDisplay(pdf, canvas)

      expect(back.x).toBeCloseTo(display.x, 5)
      expect(back.y).toBeCloseTo(display.y, 5)
      expect(back.width).toBeCloseTo(display.width, 5)
      expect(back.height).toBeCloseTo(display.height, 5)
    })

    it('should be inverse operations (with CSS scaling)', () => {
      // canvas pixel size 900x1200, but CSS renders at 450x600 (50%)
      const canvas = createMockCanvas(900, 1200, 450, 600)
      const display = { x: 50, y: 75, width: 100, height: 40 }

      const pdf = displayToPdf(display, canvas)
      const back = pdfToDisplay(pdf, canvas)

      expect(back.x).toBeCloseTo(display.x, 5)
      expect(back.y).toBeCloseTo(display.y, 5)
      expect(back.width).toBeCloseTo(display.width, 5)
      expect(back.height).toBeCloseTo(display.height, 5)
    })
  })

  describe('displayToPdf', () => {
    it('should flip Y axis (top-left origin to bottom-left origin)', () => {
      // RENDER_SCALE = 1.5, so PDF page height = 1200 / 1.5 = 800
      const canvas = createMockCanvas(900, 1200)

      // Display: top-left corner (x=0, y=0) with 150x150
      const pdf = displayToPdf({ x: 0, y: 0, width: 150, height: 150 }, canvas)

      // PDF Y should place image at top of page: pageHeight - 0 - pdfHeight
      // pdfHeight = 150 / 1.5 = 100
      // pdfY = 800 - 0 - 100 = 700
      expect(pdf.x).toBeCloseTo(0, 5)
      expect(pdf.y).toBeCloseTo(700, 5)
      expect(pdf.width).toBeCloseTo(100, 5)
      expect(pdf.height).toBeCloseTo(100, 5)
    })

    it('should convert display bottom-right to PDF origin', () => {
      const canvas = createMockCanvas(900, 1200)
      // pdfPageHeight = 800, display at bottom-right
      // display y = 1200 - 150 = 1050 (just above bottom)
      const pdf = displayToPdf({ x: 750, y: 1050, width: 150, height: 150 }, canvas)

      // pdfX = 750 / 1.5 = 500
      // pdfH = 100
      // pdfY = 800 - (1050/1.5) - 100 = 800 - 700 - 100 = 0
      expect(pdf.x).toBeCloseTo(500, 5)
      expect(pdf.y).toBeCloseTo(0, 5)
    })
  })

  describe('pdfToDisplay', () => {
    it('should convert PDF origin (0,0) to display bottom-left area', () => {
      const canvas = createMockCanvas(900, 1200)
      const display = pdfToDisplay({ x: 0, y: 0, width: 100, height: 100 }, canvas)

      // displayY = (800 - 0 - 100) * 1.5 / 1 = 700 * 1.5 = 1050
      expect(display.x).toBeCloseTo(0, 5)
      expect(display.y).toBeCloseTo(1050, 5)
      expect(display.width).toBeCloseTo(150, 5)
      expect(display.height).toBeCloseTo(150, 5)
    })
  })
})
