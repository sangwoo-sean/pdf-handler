import { readFile, writeFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'

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
