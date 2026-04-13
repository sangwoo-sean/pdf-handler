import { readFile, writeFile } from 'node:fs/promises'
import { degrees, PDFDocument } from 'pdf-lib'

export interface SerializedOverlay {
  readonly pageNumber: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly rotation: number
  readonly bytes: Uint8Array
  readonly mimeType: 'image/png' | 'image/jpeg'
}

export async function getPageCount(filePath: string): Promise<number> {
  const buffer = await readFile(filePath)
  const pdf = await PDFDocument.load(new Uint8Array(buffer))
  return pdf.getPageCount()
}

export async function mergePdfs(
  filePaths: string[],
  outputPath: string
): Promise<void> {
  const mergedPdf = await PDFDocument.create()

  for (const filePath of filePaths) {
    const buffer = await readFile(filePath)
    const sourcePdf = await PDFDocument.load(new Uint8Array(buffer))
    const pages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices())
    for (const page of pages) {
      mergedPdf.addPage(page)
    }
  }

  const mergedBytes = await mergedPdf.save()
  await writeFile(outputPath, mergedBytes)
}

export async function savePdfWithImages(
  sourcePath: string,
  outputPath: string,
  overlays: SerializedOverlay[]
): Promise<void> {
  const buffer = await readFile(sourcePath)
  const pdfDoc = await PDFDocument.load(new Uint8Array(buffer))

  for (const overlay of overlays) {
    const embeddedImage =
      overlay.mimeType === 'image/png'
        ? await pdfDoc.embedPng(overlay.bytes)
        : await pdfDoc.embedJpg(overlay.bytes)

    const pageIndex = overlay.pageNumber - 1
    const page = pdfDoc.getPage(pageIndex)

    page.drawImage(embeddedImage, {
      x: overlay.x,
      y: overlay.y,
      width: overlay.width,
      height: overlay.height,
      rotate: degrees(-overlay.rotation)
    })
  }

  const savedBytes = await pdfDoc.save()
  await writeFile(outputPath, savedBytes)
}
