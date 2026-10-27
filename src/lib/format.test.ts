import { formatDateRange } from './format'

describe('formatDateRange', () => {
  it('handles every combination', () => {
    expect(formatDateRange(undefined, undefined, 'now')).toBeUndefined()
    expect(formatDateRange(undefined, '2021-05', 'now')).toBeUndefined()
    expect(formatDateRange('2020-01', undefined, 'now')).toBe('2020-01')
    expect(formatDateRange('2020-01', 'present', 'now')).toBe('2020-01 – now')
    expect(formatDateRange('2020-01', '2021-05', 'now')).toBe('2020-01 – 2021-05')
  })
})
