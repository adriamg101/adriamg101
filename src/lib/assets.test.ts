import { describe, expect, it } from 'vitest'
import { resolveAsset } from './assets'

describe('resolveAsset', () => {
  it('prefixes root-relative paths with the base', () => {
    expect(resolveAsset('/icons/x.svg', '/adriamg101/')).toBe('/adriamg101/icons/x.svg')
  })
  it('prefixes relative paths with the base', () => {
    expect(resolveAsset('icons/x.svg', '/adriamg101/')).toBe('/adriamg101/icons/x.svg')
  })
  it('tolerates a base without trailing slash and dot-relative paths', () => {
    expect(resolveAsset('./icons/x.svg', '/adriamg101')).toBe('/adriamg101/icons/x.svg')
  })
  it('works with a root base', () => {
    expect(resolveAsset('/icons/x.svg', '/')).toBe('/icons/x.svg')
  })
  it('leaves absolute urls and data uris alone', () => {
    expect(resolveAsset('https://a.b/x.svg', '/adriamg101/')).toBe('https://a.b/x.svg')
    expect(resolveAsset('//a.b/x.svg', '/adriamg101/')).toBe('//a.b/x.svg')
    expect(resolveAsset('data:image/svg+xml;base64,AAA', '/adriamg101/')).toBe('data:image/svg+xml;base64,AAA')
  })
  it('defaults to the Vite base', () => {
    expect(resolveAsset('icons/x.svg')).toBe(`${import.meta.env.BASE_URL}icons/x.svg`)
  })
})
