import { describe, expect, it } from 'vitest'
import { isPropertyVisible } from './ndvUtils'

describe('isPropertyVisible', () => {
  it('shows property when no displayOptions', () => {
    expect(isPropertyVisible({ name: 'x' }, {})).toBe(true)
  })

  it('respects displayOptions.show array match', () => {
    const prop = {
      name: 'secret',
      displayOptions: { show: { mode: ['advanced'] } },
    }
    expect(isPropertyVisible(prop, { mode: 'advanced' })).toBe(true)
    expect(isPropertyVisible(prop, { mode: 'basic' })).toBe(false)
  })

  it('respects displayOptions.show scalar match', () => {
    const prop = {
      name: 'secret',
      displayOptions: { show: { enabled: true } },
    }
    expect(isPropertyVisible(prop, { enabled: true })).toBe(true)
    expect(isPropertyVisible(prop, { enabled: false })).toBe(false)
  })
})
