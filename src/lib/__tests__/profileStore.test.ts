// src/lib/__tests__/profileStore.test.ts
//
// Pure-profile-logic tests for the collection store. The localStorage-backed
// accessors are SSR-safe and skipped in node, so the dedupe/remove behavior
// is verified through upsertProfile / removeProfileByKey / profileKey.
//
// @vitest-environment node

import { describe, it, expect } from 'vitest'
import {
  profileKey,
  upsertProfile,
  removeProfileByKey,
} from '../profileStore'
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
  ...A,
  dateISO: '1995-07-20',
  placeName: 'Surabaya',
}

describe('profileStore — pure profile logic', () => {
  it('profileKey distinguishes different birth signatures', () => {
    expect(profileKey(A)).not.toBe(profileKey(B))
    expect(profileKey(A)).toBe(profileKey({ ...A }))
  })

  it('upsertProfile prepends new profiles, newest first', () => {
    const list = upsertProfile([A], B)
    expect(list).toHaveLength(2)
    expect(list[0]).toBe(B)
    expect(list[1]).toBe(A)
  })

  it('upsertProfile replaces an existing profile instead of duplicating', () => {
    const dup: BirthData = { ...A, placeName: 'Jakarta Pusat' }
    const list = upsertProfile([A], dup)
    expect(list).toHaveLength(1)
    expect(list[0]).toBe(dup)
  })

  it('removeProfileByKey removes only the matching profile', () => {
    const list = removeProfileByKey([A, B], profileKey(A))
    expect(list).toHaveLength(1)
    expect(list[0]).toBe(B)
  })
})