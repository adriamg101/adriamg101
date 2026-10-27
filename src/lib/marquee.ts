export function copiesNeeded(contentWidth: number, viewportWidth: number): number {
  return contentWidth <= 0 ? 2 : Math.max(2, Math.ceil(viewportWidth / contentWidth) + 1)
}

/** Wraps an offset into (-loopWidth, 0]. */
export function wrapOffset(offset: number, loopWidth: number): number {
  if (loopWidth <= 0) return 0
  let r = offset % loopWidth
  if (r > 0) r -= loopWidth
  return r === 0 ? 0 : r
}

export function isDrag(dx: number): boolean {
  return Math.abs(dx) > 5
}
