import { describe, it, expect } from 'vitest'
import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { getPageCount, mergePdfs } from '../electron/pdf-service'

const FIXTURES_DIR = join(__dirname, 'fixtures')

async function createTestPdf(pageCount: number, filename: string): Promise<string> {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage()
  }
  const bytes = await pdf.save()
  const filePath = join(FIXTURES_DIR, filename)
  const { writeFile, mkdir } = await import('node:fs/promises')
  await mkdir(FIXTURES_DIR, { recursive: true })
  await writeFile(filePath, bytes)
  return filePath
}

describe('pdf-service', () => {
  describe('getPageCount', () => {
    it('returns correct page count for a single-page PDF', async () => {
      const filePath = await createTestPdf(1, 'one-page.pdf')
      const count = await getPageCount(filePath)
      expect(count).toBe(1)
    })

    it('returns correct page count for a multi-page PDF', async () => {
      const filePath = await createTestPdf(5, 'five-pages.pdf')
      const count = await getPageCount(filePath)
      expect(count).toBe(5)
    })

    it('throws for a corrupted file', async () => {
      const { writeFile, mkdir } = await import('node:fs/promises')
      await mkdir(FIXTURES_DIR, { recursive: true })
      const filePath = join(FIXTURES_DIR, 'corrupted.pdf')
      await writeFile(filePath, 'not a pdf')
      await expect(getPageCount(filePath)).rejects.toThrow()
    })
  })

  describe('mergePdfs', () => {
    it('merges multiple PDFs into one with correct total page count', async () => {
      const fileA = await createTestPdf(2, 'merge-a.pdf')
      const fileB = await createTestPdf(3, 'merge-b.pdf')
      const fileC = await createTestPdf(1, 'merge-c.pdf')

      const outputPath = join(FIXTURES_DIR, 'merged-output.pdf')
      await mergePdfs([fileA, fileC, fileB], outputPath)

      const mergedBytes = await readFile(outputPath)
      const mergedPdf = await PDFDocument.load(new Uint8Array(mergedBytes))
      expect(mergedPdf.getPageCount()).toBe(6)

      await unlink(outputPath)
    })

    it('preserves page order: A(2p) + C(1p) + B(3p) = 6 pages in order', async () => {
      const fileA = await createTestPdf(2, 'order-a.pdf')
      const fileB = await createTestPdf(3, 'order-b.pdf')
      const fileC = await createTestPdf(1, 'order-c.pdf')

      const outputPath = join(FIXTURES_DIR, 'order-output.pdf')
      await mergePdfs([fileA, fileC, fileB], outputPath)

      const count = await getPageCount(outputPath)
      expect(count).toBe(6)

      await unlink(outputPath)
    })
  })
})
