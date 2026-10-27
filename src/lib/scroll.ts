export const SHOW_AFTER_PX = 100

export function shouldShowBackToTop(scrollY: number, scrollHeight: number, innerHeight: number): boolean {
  return scrollHeight > innerHeight && scrollY >= SHOW_AFTER_PX
}
