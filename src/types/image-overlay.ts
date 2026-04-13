export type ImageMimeType = 'image/png' | 'image/jpeg'

export interface ImageOverlay {
  readonly id: string
  readonly pageNumber: number
  /** PDF 좌표계 (72 DPI, 좌하단 원점) */
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  /** 회전 각도 (도, 시계 방향) */
  readonly rotation: number
  readonly dataUrl: string
  readonly bytes: Uint8Array
  readonly mimeType: ImageMimeType
}

export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface SerializedOverlay {
  readonly pageNumber: number
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly rotation: number
  readonly bytes: Uint8Array
  readonly mimeType: ImageMimeType
}
