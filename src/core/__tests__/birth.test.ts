import { describe, it, expect } from 'vitest'
import {
  BirthValidationError,
  calculateLMT,
  equationOfTime,
  isValidIANATimezone,
  normaliseBirthData,
  resolveBirthTimeLMT,
  resolveTimezone,
  validateBirthData,
  type BirthData,
} from '../birth'

/** Helper: a minimal valid BirthData with overrides applied. */
function makeBirth(overrides: Partial<BirthData> = {}): BirthData {
  return {
    dateISO: '2000-01-01',
    timeISO: '12:00',
    lat: -6.2088,
    lng: 106.8456,
    tzIANA: 'Asia/Jakarta',
    placeName: 'Jakarta',
    isTimeEstimated: false,
    ...overrides,
  }
}

describe('validateBirthData', () => {
  it('accepts a valid BirthData', () => {
    const b = makeBirth()
    expect(validateBirthData(b)).toBe(b)
  })

  it('rejects invalid IANA timezone "Mars/Phobos"', () => {
    const b = makeBirth({ tzIANA: 'Mars/Phobos' })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
    expect(() => validateBirthData(b)).toThrow(/Mars\/Phobos/)
  })

  it('rejects lat=91 (above north pole)', () => {
    const b = makeBirth({ lat: 91 })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
    expect(() => validateBirthData(b)).toThrow(/lat/)
  })

  it('rejects lat=-91 (below south pole)', () => {
    const b = makeBirth({ lat: -91 })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
    expect(() => validateBirthData(b)).toThrow(/lat/)
  })

  it('rejects lng=181 (outside antimeridian)', () => {
    const b = makeBirth({ lng: 181 })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
    expect(() => validateBirthData(b)).toThrow(/lng/)
  })

  it('rejects lng=-181', () => {
    const b = makeBirth({ lng: -181 })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
    expect(() => validateBirthData(b)).toThrow(/lng/)
  })

  it('accepts boundary lat=90 and lat=-90', () => {
    expect(validateBirthData(makeBirth({ lat: 90 })).lat).toBe(90)
    expect(validateBirthData(makeBirth({ lat: -90 })).lat).toBe(-90)
  })

  it('accepts boundary lng=180 and lng=-180', () => {
    expect(validateBirthData(makeBirth({ lng: 180 })).lng).toBe(180)
    expect(validateBirthData(makeBirth({ lng: -180 })).lng).toBe(-180)
  })

  it('rejects malformed dateISO "2000-13-01"', () => {
    const b = makeBirth({ dateISO: '2000-13-01' })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
    expect(() => validateBirthData(b)).toThrow(/dateISO/)
  })

  it('rejects overflowed date "2000-02-30"', () => {
    const b = makeBirth({ dateISO: '2000-02-30' })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
  })

  it('rejects malformed timeISO "25:00"', () => {
    const b = makeBirth({ timeISO: '25:00' })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
    expect(() => validateBirthData(b)).toThrow(/timeISO/)
  })

  it('accepts timeISO=null (unknown time)', () => {
    expect(validateBirthData(makeBirth({ timeISO: null })).timeISO).toBeNull()
  })

  it('rejects empty placeName', () => {
    const b = makeBirth({ placeName: '   ' })
    expect(() => validateBirthData(b)).toThrow(BirthValidationError)
    expect(() => validateBirthData(b)).toThrow(/placeName/)
  })
})

describe('isValidIANATimezone', () => {
  it('returns false for "Mars/Phobos"', () => {
    expect(isValidIANATimezone('Mars/Phobos')).toBe(false)
  })

  it('returns true for "Asia/Jakarta"', () => {
    expect(isValidIANATimezone('Asia/Jakarta')).toBe(true)
  })

  it('returns false for empty string', () => {
    expect(isValidIANATimezone('')).toBe(false)
  })
})

describe('calculateLMT', () => {
  it('Jakarta (106.8456°E) -> UTC+7:07:23 within ±30s', () => {
    const lmt = calculateLMT(106.8456)
    // Expected: 106.8456 / 15 = 7.12304h = 7h 7m 23.544s -> rounded 7h7m24s.
    // AC tolerance ±30s: accept 7:06:53 .. 7:07:53.
    expect(lmt.hh).toBe(7)
    const totalSeconds = lmt.hh * 3600 + lmt.mm * 60 + lmt.ss
    // 7:06:53 = 25613s ; 7:07:53 = 25673s ; 7:07:23 = 25643s target.
    expect(totalSeconds).toBeGreaterThanOrEqual(25613)
    expect(totalSeconds).toBeLessThanOrEqual(25673)
  })

  it('matches LMT_offset = lng / 15 hours (east positive)', () => {
    const lmt = calculateLMT(106.8456)
    const expectedSeconds = Math.round((106.8456 / 15) * 3600)
    expect(lmt.offsetSeconds).toBe(expectedSeconds)
    expect(lmt.offsetSeconds).toBeGreaterThan(0)
  })

  it('west longitude -> negative offset (UTC behind)', () => {
    const lmt = calculateLMT(-74.006) // New York ~ -4h56m
    expect(lmt.offsetSeconds).toBeLessThan(0)
    expect(lmt.hh).toBe(-4)
    // -4:56:01 rounded; verify within ~5min of -4h56m.
    const totalSeconds = lmt.offsetSeconds
    expect(totalSeconds).toBeGreaterThan(-(5 * 3600))
    expect(totalSeconds).toBeLessThan(-(4 * 3600))
  })

  it('lng=0 -> offset 0 (UTC == LMT at Greenwich)', () => {
    const lmt = calculateLMT(0)
    expect(lmt.offsetSeconds).toBe(0)
    expect(lmt.hh).toBe(0)
    expect(lmt.mm).toBe(0)
    expect(lmt.ss).toBe(0)
  })

  it('throws for out-of-range longitude', () => {
    expect(() => calculateLMT(181)).toThrow(BirthValidationError)
    expect(() => calculateLMT(-181)).toThrow(BirthValidationError)
    expect(() => calculateLMT(NaN)).toThrow(BirthValidationError)
  })
})

describe('normaliseBirthData — unknown-time semantics', () => {
  it('timeISO=null -> isTimeEstimated forced true', () => {
    const raw = makeBirth({ timeISO: null, isTimeEstimated: false })
    const n = normaliseBirthData(raw)
    expect(n.isTimeEstimated).toBe(true)
    expect(n.timeISO).toBeNull()
  })

  it('timeISO=null with isTimeEstimated=true passes through', () => {
    const raw = makeBirth({ timeISO: null, isTimeEstimated: true })
    expect(normaliseBirthData(raw).isTimeEstimated).toBe(true)
  })

  it('known time is not marked estimated', () => {
    const raw = makeBirth({ timeISO: '12:00', isTimeEstimated: false })
    expect(normaliseBirthData(raw).isTimeEstimated).toBe(false)
  })
})

describe('resolveBirthTimeLMT', () => {
  it('timeISO=null substitutes 12:00 LMT (noon local mean time)', () => {
    const raw = makeBirth({ timeISO: null, isTimeEstimated: false })
    // Use a date whose UTC midnight is 2000-01-01; noon UTC = 12:00Z.
    const utc = new Date('2000-01-01T12:00:00Z')
    const { lmt, effectiveTimeISO } = resolveBirthTimeLMT(raw, utc)
    // Noon UTC + Jakarta LMT offset (~+7:07:24) -> ~19:07:24 local LMT.
    // The point of this test: the substituted time is the LMT noon,
    // not a WIB-zone noon. We assert the offset was applied.
    expect(lmt.offsetSeconds).toBeGreaterThan(0)
    expect(effectiveTimeISO).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    // AC: substituted time is the LMT noon, NOT the WIB civil-zone noon.
    const [h, m, s] = effectiveTimeISO.split(':').map(Number)
    const localSeconds = h * 3600 + m * 60 + s
    const expectedSeconds = 12 * 3600 + lmt.offsetSeconds
    expect(Math.abs(localSeconds - expectedSeconds)).toBeLessThanOrEqual(1)
    // Sanity: it's not 12:00:00 (which would be the WIB-noon error case).
    expect(effectiveTimeISO).not.toBe('12:00:00')
  })

  it('known time passes through, padded to HH:mm:ss', () => {
    const raw = makeBirth({ timeISO: '14:30', isTimeEstimated: false })
    const { effectiveTimeISO } = resolveBirthTimeLMT(
      raw,
      new Date('2000-01-01T12:00:00Z'),
    )
    expect(effectiveTimeISO).toBe('14:30:00')
  })

  it('known time with seconds passes through unchanged', () => {
    const raw = makeBirth({ timeISO: '14:30:45', isTimeEstimated: false })
    const { effectiveTimeISO } = resolveBirthTimeLMT(
      raw,
      new Date('2000-01-01T12:00:00Z'),
    )
    expect(effectiveTimeISO).toBe('14:30:45')
  })
})

describe('equationOfTime (NOAA approximation)', () => {
  it('returns a value within ±20 minutes', () => {
    // Sample several days across the year.
    const samples = [
      new Date('2000-01-01T12:00:00Z'),
      new Date('2000-02-12T12:00:00Z'),
      new Date('2000-04-15T12:00:00Z'),
      new Date('2000-06-13T12:00:00Z'),
      new Date('2000-08-01T12:00:00Z'),
      new Date('2000-11-03T12:00:00Z'),
      new Date('2000-12-25T12:00:00Z'),
    ]
    for (const d of samples) {
      const eot = equationOfTime(d)
      expect(eot).toBeGreaterThanOrEqual(-20)
      expect(eot).toBeLessThanOrEqual(20)
    }
  })

  it('is near zero around the equinoxes (mid-April)', () => {
    // EOT crosses zero near April 15; value should be small.
    const eot = equationOfTime(new Date('2000-04-15T12:00:00Z'))
    expect(Math.abs(eot)).toBeLessThan(5)
  })

  it('determinism: same date -> same EOT', () => {
    const d = new Date('2000-07-01T12:00:00Z')
    expect(equationOfTime(d)).toBe(equationOfTime(d))
  })
})

describe('resolveTimezone', () => {
  it('resolves Asia/Jakarta for a modern date, not approximated', () => {
    const r = resolveTimezone('Asia/Jakarta', new Date('2000-01-01T12:00:00Z'))
    expect(r.tzIANA).toBe('Asia/Jakarta')
    expect(r.approximated).toBe(false)
    // WIB is +07:00 = 420 min.
    expect(r.offsetMinutes).toBe(420)
  })

  it('resolves a UTC-5 zone (America/New_York standard) for winter', () => {
    const r = resolveTimezone('America/New_York', new Date('2000-01-15T12:00:00Z'))
    expect(r.approximated).toBe(false)
    // EST = -300 min in January (no DST).
    expect(r.offsetMinutes).toBe(-300)
  })

  it('throws for invalid tz', () => {
    expect(() =>
      resolveTimezone('Mars/Phobos', new Date('2000-01-01T12:00:00Z')),
    ).toThrow(BirthValidationError)
  })

  it('falls back to standard offset for a pre-1970 date when Intl lacks data', () => {
    // For 1850, Node's Intl has data for major zones, so this primarily
    // exercises the fallback *path*. We construct a case where the
    // fallback is forced by using a zone whose standard offset we know.
    // Strategy: probe directly; if Intl returns data, the test asserts
    // the primary path; if not, the fallback path with approximated=true.
    const r = resolveTimezone('Asia/Jakarta', new Date('1850-06-01T12:00:00Z'))
    if (r.approximated) {
      // Fallback path: must be the standard WIB offset and marked approx.
      expect(r.offsetMinutes).toBe(420)
      expect(r.approximated).toBe(true)
    } else {
      // Primary path: offset should still be a plausible WIB value.
      expect(r.offsetMinutes).toBeGreaterThanOrEqual(420)
      expect(r.offsetMinutes).toBeLessThanOrEqual(450)
    }
  })
})

describe('determinism', () => {
  it('calculateLMT is deterministic across 2 calls (same input)', () => {
    const a = calculateLMT(106.8456)
    const b = calculateLMT(106.8456)
    expect(a).toEqual(b)
  })

  it('validateBirthData is deterministic across 2 calls', () => {
    const data = makeBirth()
    const a = validateBirthData(data)
    const b = validateBirthData(data)
    expect(a).toBe(b)
  })

  it('resolveBirthTimeLMT is deterministic across 2 calls', () => {
    const raw = makeBirth({ timeISO: null })
    const utc = new Date('2000-01-01T12:00:00Z')
    const a = resolveBirthTimeLMT(raw, utc)
    const b = resolveBirthTimeLMT(raw, utc)
    expect(a).toEqual(b)
  })

  it('equationOfTime is deterministic across 2 calls', () => {
    const d = new Date('2000-03-21T12:00:00Z')
    expect(equationOfTime(d)).toBe(equationOfTime(d))
  })
})

describe('Jakarta integration AC', () => {
  it('Jakarta 106.8456°E, 12:00 WIB -> LMT = UTC+7:07:23 (±30s)', () => {
    // AC: Jakarta (106.8456°E, Asia/Jakarta) 12:00 WIB -> LMT = UTC+7:07:23.
    // LMT is derived purely from longitude, not from the civil zone (WIB).
    const lmt = calculateLMT(106.8456)
    // 7:07:23 = 7*3600 + 7*60 + 23 = 25643s.
    const target = 7 * 3600 + 7 * 60 + 23
    expect(Math.abs(lmt.offsetSeconds - target)).toBeLessThanOrEqual(30)
    // hh:mm:ss decomposition must be 7:07:23 (or 7:07:24 after rounding).
    expect(lmt.hh).toBe(7)
    expect(lmt.mm).toBe(7)
    // ss in {23, 24} given rounding of 23.544s.
    expect(lmt.ss).toBeGreaterThanOrEqual(23)
    expect(lmt.ss).toBeLessThanOrEqual(24)
  })
})
