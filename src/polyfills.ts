/**
 * Uint8Array.prototype.toHex polyfill
 *
 * pdfjs-dist 5.x uses toHex() which requires Chrome 139+.
 * Electron 35 bundles Chromium ~134, so we need this polyfill.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (Uint8Array.prototype as any).toHex !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(Uint8Array.prototype as any).toHex = function (this: Uint8Array): string {
    let hex = ''
    for (let i = 0; i < this.length; i++) {
      hex += this[i].toString(16).padStart(2, '0')
    }
    return hex
  }
}
