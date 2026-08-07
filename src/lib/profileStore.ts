// src/lib/profileStore.ts — client-side profile collection backed by
// localStorage. Local-first by design: saved charts never leave the browser.
// All accessors are SSR-safe (no window/localStorage in node), and identity
// for dedupe is the full birth signature, so re-saving the same chart updates
// instead of duplicating.

import type { BirthData } from '../core/birth'

const PROFILES_KEY = 'akasha:profiles'

/** Stable identity for one chart — dedupes re-saves of the same profile. */
export function profileKey(p: BirthData): string {
  return `${p.dateISO}|${p.timeISO ?? ''}|${p.lat}|${p.lng}|${p.tzIANA}`
}

/** Insert-or-update a profile in a list, newest first. Pure. */
export function upsertProfile(
  list: readonly BirthData[],
  profile: BirthData,
): BirthData[] {
  const key = profileKey(profile)
  const rest = list.filter((p) => profileKey(p) !== key)
  return [profile, ...rest]
}

/** Remove a profile by its identity key. Pure. */
export function removeProfileByKey(
  list: readonly BirthData[],
  key: string,
): BirthData[] {
  return list.filter((p) => profileKey(p) !== key)
}

function readProfiles(): BirthData[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PROFILES_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as BirthData[]) : []
  } catch (err: unknown) {
    console.error('Akasha: koleksi profil gagal dibaca', err)
    return []
  }
}

function writeProfiles(list: readonly BirthData[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(list))
  } catch (err: unknown) {
    console.error('Akasha: koleksi profil gagal disimpan', err)
  }
}

/** Load the persisted profile collection (SSR-safe). */
export function loadProfiles(): BirthData[] {
  return readProfiles()
}

/** Save a profile into the collection; returns the updated list. */
export function saveProfile(profile: BirthData): BirthData[] {
  const next = upsertProfile(loadProfiles(), profile)
  writeProfiles(next)
  return next
}

/** Delete a profile by key; returns the updated list. */
export function deleteProfile(key: string): BirthData[] {
  const next = removeProfileByKey(loadProfiles(), key)
  writeProfiles(next)
  return next
}
