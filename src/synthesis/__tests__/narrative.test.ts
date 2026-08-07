// src/synthesis/__tests__/narrative.test.ts — tests for narrative synthesis.
//
// Locks the tlDr template contract: every horizon's tlDr is non-empty,
// contains the agreement label, EXACTLY two domain names (highest + lowest),
// and both scores. Also exercises validation errors and the full narrative
// shape. The tlDr is built by `buildTlDr` from the adapter input — no LLM,
// fully deterministic.

import { describe, expect, it } from 'vitest'
import {
  AGREEMENT_LABELS,
  DOMAIN_NAMES,
  HORIZONS,
  buildNarrative,
  buildTlDr,
} from '../narrative'
import type { NarrativeInput } from '../narrative'

/** Count how many of the four domain names appear in `text`. */
function countDomains(text: string): number {
  return DOMAIN_NAMES.filter((d) => text.includes(d)).length
}

/** Which domain names appear in `text`. */
function domainsIn(text: string): string[] {
  return DOMAIN_NAMES.filter((d) => text.includes(d))
}

describe('buildTlDr', () => {
  it('renders the mingguan Tinggi example from the plan verbatim', () => {
    const input: NarrativeInput = {
      horizon: 'mingguan',
      agreementLabel: 'Tinggi',
      topDomain: { name: 'Karier', score: 78 },
      bottomDomain: { name: 'Cinta', score: 32 },
    }
    expect(buildTlDr(input)).toBe(
      'Minggu ini: persetujuan Tinggi — Karier teratas (skor 78), ' +
        'Cinta paling perlu hati-hati (skor 32).',
    )
  })

  it.each(HORIZONS.map((h) => [h] as const))(
    'produces a non-empty tlDr for horizon %s',
    (horizon) => {
      const input: NarrativeInput = {
        horizon,
        agreementLabel: 'Sedang',
        topDomain: { name: 'Karier', score: 60 },
        bottomDomain: { name: 'Cinta', score: 30 },
      }
      const tl = buildTlDr(input)
      expect(tl.length).toBeGreaterThan(0)
    },
  )

  it.each(AGREEMENT_LABELS.map((l) => [l] as const))(
    'includes the agreement label %s in the tlDr',
    (agreementLabel) => {
      const input: NarrativeInput = {
        horizon: 'harian',
        agreementLabel,
        topDomain: { name: 'Karier', score: 70 },
        bottomDomain: { name: 'Cinta', score: 20 },
      }
      expect(buildTlDr(input)).toContain(`persetujuan ${agreementLabel}`)
    },
  )

  it('contains exactly two domain names (top + bottom) when they differ', () => {
    const input: NarrativeInput = {
      horizon: 'mingguan',
      agreementLabel: 'Tinggi',
      topDomain: { name: 'Karier', score: 78 },
      bottomDomain: { name: 'Cinta', score: 32 },
    }
    const tl = buildTlDr(input)
    expect(countDomains(tl)).toBe(2)
    expect(domainsIn(tl)).toEqual(['Karier', 'Cinta'])
  })

  it('contains exactly two domain names even when top == bottom name is disallowed', () => {
    // Top and bottom are by definition distinct domains; construct a case
    // using the two remaining names to confirm exactly-2 still holds.
    const input: NarrativeInput = {
      horizon: 'tahunan',
      agreementLabel: 'Rendah',
      topDomain: { name: 'Kesehatan', score: 55 },
      bottomDomain: { name: 'Keuangan', score: 25 },
    }
    const tl = buildTlDr(input)
    expect(countDomains(tl)).toBe(2)
    expect(domainsIn(tl)).toEqual(['Kesehatan', 'Keuangan'])
  })

  it('includes both numeric scores in the tlDr', () => {
    const input: NarrativeInput = {
      horizon: 'bulanan',
      agreementLabel: 'Sedang',
      topDomain: { name: 'Keuangan', score: 66 },
      bottomDomain: { name: 'Kesehatan', score: 38 },
    }
    const tl = buildTlDr(input)
    expect(tl).toContain('(skor 66)')
    expect(tl).toContain('(skor 38)')
  })

  it('rounds non-integer scores to the nearest integer', () => {
    const input: NarrativeInput = {
      horizon: 'harian',
      agreementLabel: 'Sedang',
      topDomain: { name: 'Karier', score: 78.4 },
      bottomDomain: { name: 'Cinta', score: 32.6 },
    }
    const tl = buildTlDr(input)
    expect(tl).toContain('(skor 78)')
    expect(tl).toContain('(skor 33)')
  })

  it('uses the horizon label as the opening word', () => {
    const cases = [
      ['harian', 'Hari'],
      ['mingguan', 'Minggu'],
      ['bulanan', 'Bulan'],
      ['tahunan', 'Tahun'],
    ] as const
    for (const [horizon, label] of cases) {
      const input: NarrativeInput = {
        horizon,
        agreementLabel: 'Sedang',
        topDomain: { name: 'Karier', score: 50 },
        bottomDomain: { name: 'Cinta', score: 40 },
      }
      expect(buildTlDr(input).startsWith(`${label} ini:`)).toBe(true)
    }
  })
})

describe('buildTlDr validation', () => {
  it('rejects an unknown horizon', () => {
    const input = {
      horizon: 'jamuran',
      agreementLabel: 'Sedang',
      topDomain: { name: 'Karier', score: 50 },
      bottomDomain: { name: 'Cinta', score: 40 },
    }
    expect(() => buildTlDr(input as unknown as NarrativeInput)).toThrow(RangeError)
  })

  it('rejects an unknown agreement label', () => {
    const input = {
      horizon: 'harian',
      agreementLabel: 'Sangat',
      topDomain: { name: 'Karier', score: 50 },
      bottomDomain: { name: 'Cinta', score: 40 },
    }
    expect(() => buildTlDr(input as unknown as NarrativeInput)).toThrow(RangeError)
  })

  it('rejects an unknown domain name', () => {
    const input = {
      horizon: 'harian',
      agreementLabel: 'Sedang',
      topDomain: { name: 'Rezeki', score: 50 },
      bottomDomain: { name: 'Cinta', score: 40 },
    }
    expect(() => buildTlDr(input as unknown as NarrativeInput)).toThrow(RangeError)
  })

  it('rejects an out-of-range score', () => {
    const input = {
      horizon: 'harian',
      agreementLabel: 'Sedang',
      topDomain: { name: 'Karier', score: 150 },
      bottomDomain: { name: 'Cinta', score: 40 },
    }
    expect(() => buildTlDr(input as unknown as NarrativeInput)).toThrow(RangeError)
  })
})

describe('buildNarrative', () => {
  it('starts with the tlDr as the first line', () => {
    const input: NarrativeInput = {
      horizon: 'mingguan',
      agreementLabel: 'Tinggi',
      topDomain: { name: 'Karier', score: 78 },
      bottomDomain: { name: 'Cinta', score: 32 },
    }
    const tl = buildTlDr(input)
    const narrative = buildNarrative(input)
    expect(narrative.startsWith(tl)).toBe(true)
    expect(narrative.split('\n')[0]).toBe(tl)
  })

  it('has a non-empty body after the tlDr', () => {
    const input: NarrativeInput = {
      horizon: 'tahunan',
      agreementLabel: 'Tinggi',
      topDomain: { name: 'Karier', score: 82 },
      bottomDomain: { name: 'Keuangan', score: 45 },
    }
    const narrative = buildNarrative(input)
    const lines = narrative.split('\n').filter((l) => l.trim().length > 0)
    expect(lines.length).toBeGreaterThanOrEqual(2)
  })

  it('is deterministic: same input yields identical output', () => {
    const input: NarrativeInput = {
      horizon: 'bulanan',
      agreementLabel: 'Sedang',
      topDomain: { name: 'Keuangan', score: 66 },
      bottomDomain: { name: 'Kesehatan', score: 38 },
    }
    expect(buildNarrative(input)).toBe(buildNarrative(input))
  })
})
