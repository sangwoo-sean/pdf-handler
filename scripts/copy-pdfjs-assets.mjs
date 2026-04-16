import { cpSync, mkdirSync, existsSync, rmSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '..')
const pdfjsRoot = resolve(repoRoot, 'node_modules/pdfjs-dist')
const destRoot = resolve(repoRoot, 'src/public/pdfjs')

const pairs = [
  ['cmaps', 'cmaps'],
  ['standard_fonts', 'standard_fonts']
]

for (const [srcName, destName] of pairs) {
  const src = resolve(pdfjsRoot, srcName)
  const dest = resolve(destRoot, destName)
  if (!existsSync(src)) {
    console.error(`[copy-pdfjs-assets] missing source: ${src}`)
    process.exit(1)
  }
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true })
  console.log(`[copy-pdfjs-assets] ${srcName} -> src/public/pdfjs/${destName}`)
}
