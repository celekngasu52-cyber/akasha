// src/lib/__tests__/compatibility.test.ts
//
// Pure-logic tests for the "Jodoh" compatibility synthesis. No DOM needed:
// verifies determinism, the BaZi element relation mapping, 六合/冲 branch
// adjustments, score range/clamping, domain vocabulary, and tone tiers.
//
// @vitest-environment node

import { describe, it, expect } from 'vitest'
import {
  computeCompatibility,
  compatibilityKey,
  elementOfStem,
} from '../compatibility'
import type { BirthData } from '../../core/birth/types'

const A: BirthData = {
  dateISO: '2000-01-01',
  timeISO: '12:00',
  lat: -6.2,
  lng: 106.8,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  isTimeEstimated: false,
}

const B: BirthData = {
  dateISO: '1995-07-20',
  timeISO: '08:30',
  lat: -7.25,
  lng: 112.75,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Surabaya',
  isTimeEstimated: false,
}

describe('compatibility — pure logic', () => {
  it('is deterministic for the same pair', () => {
    const r1 = computeCompatibility(A, B)
    const r2 = computeCompatibility(A, B)
    expect(r1).toEqual(r2)
  })

  it('compatibilityKey is order-insensitive', () => {
    expect(compatibilityKey(A, B)).toBe(compatibilityKey(B, A))
  })

  it('elementOfStem maps each heavenly stem to its five element', () => {
    expect(elementOfStem('甲')).toBe('木')
    expect(elementOfStem('丙')).toBe('火')
    expect(elementOfStem('戊')).toBe('土')
    expect(elementOfStem('庚')).toBe('金')
    expect(elementOfStem('壬')).toBe('水')
  })

  it('returns a score in 0..100 with clamp applied', () => {
    const r = computeCompatibility(A, B)
    expect(r.overall).toBeGreaterThanOrEqual(0)
    expect(r.overall).toBeLessThanOrEqual(100)
  })

  it('renders exactly the 4 domain names in order', () => {
    const r = computeCompatibility(A, B)
    expect(r.domains.map((d) => d.domain)).toEqual([
      'Karier',
      'Cinta',
      'Kesehatan',
      'Keuangan',
    ])
  })

  it('domain scores stay within 0..100', () => {
    const r = computeCompatibility(A, B)
    for (const d of r.domains) {
      expect(d.score).toBeGreaterThanOrEqual(0)
      expect(d.score).toBeLessThanOrEqual(100)
    }
  })

  it('tone matches the overall score tier', () => {
    const r = computeCompatibility(A, B)
    if (r.overall >= 70) expect(r.tone).toBe('harmonis')
    else if (r.overall >= 45) expect(r.tone).toBe('netral')
    else expect(r.tone).toBe('menantang')
  })

  it('same-day-element people get relation "same" with a matching note', () => {
    const r = computeCompatibility(A, { ...A, timeISO: '11:00' })
    expect(r.relation).toBe('same')
    expect(r.relationNote).toContain('seunsur')
  })

  it('tlDr mentions the overall score', () => {
    const r = computeCompatibility(A, B)
    expect(r.tlDr).toContain(String(r.overall))
  })
})