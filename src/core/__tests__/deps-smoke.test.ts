import { describe, it, expect } from 'vitest'
import { Lunar } from 'lunar-javascript'
import SwissEph from 'swisseph-wasm'

describe('deps smoke test', () => {
  it('imports lunar-javascript and creates Lunar instance from a date', () => {
    const lunar = Lunar.fromDate(new Date('2000-01-01T12:00:00Z'))
    expect(lunar).toBeDefined()
  })

  it('imports swisseph-wasm and instantiates SwissEph', () => {
    const swe = new SwissEph()
    expect(swe).toBeDefined()
    // SE_SUN is a readonly constant (0) on the instance — proves the class shape.
    expect(swe.SE_SUN).toBe(0)
  })
})
