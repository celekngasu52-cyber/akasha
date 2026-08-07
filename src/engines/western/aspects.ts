// src/engines/western/aspects.ts — major Ptolemaic aspects.
//
// Aspects are computed from tropical ecliptic longitudes. The five major
// aspects are conjunction (0°), opposition (180°), square (90°), trine
// (120°), and sextile (60°). Orbs: 8° for conjunction/opposition/square/trine,
// 6° for sextile (smaller orb because the sextile is the weakest aspect).
//
// The angular separation is the shortest arc between two longitudes on a
// circle: min(|a-b|, 360-|a-b|), always in [0, 180]. An aspect is present
// when |exact - actual| <= orb.

import type {
  Aspect,
  AspectType,
  WesternBody,
  WesternPosition,
  AngleName,
} from './types'

/** Orb applied to conjunction, opposition, square, trine. */
const ORB_MAJOR = 8
/** Orb applied to the sextile (weaker aspect, tighter orb). */
const ORB_SEXTILE = 6

/** The five major aspects and their exact angles + orbtolerances. */
interface AspectDef {
  readonly type: AspectType
  readonly exactAngle: number
  readonly orb: number
}

const ASPECT_DEFS: readonly AspectDef[] = [
  { type: 'conjunction', exactAngle: 0, orb: ORB_MAJOR },
  { type: 'sextile', exactAngle: 60, orb: ORB_SEXTILE },
  { type: 'square', exactAngle: 90, orb: ORB_MAJOR },
  { type: 'trine', exactAngle: 120, orb: ORB_MAJOR },
  { type: 'opposition', exactAngle: 180, orb: ORB_MAJOR },
] as const

/** Shortest arc between two longitudes on a circle, in [0, 180]. */
export function angularSeparation(a: number, b: number): number {
  const raw = Math.abs(a - b) % 360
  return raw > 180 ? 360 - raw : raw
}

/**
 * Compute all major aspects between the given positions. Every unordered pair
 * is considered once; an aspect is emitted only when its orb is within the
 * tolerance. Multiple aspects between the same pair are possible (rarely, when
 * the separation is near a multiple of 60°), but each def fires at most once.
 *
 * The first pair member follows planets+angles order in `positions`, so output
 * is deterministic for the same input.
 */
export function computeAspects(
  positions: readonly WesternPosition[],
): Aspect[] {
  const out: Aspect[] = []
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const a = positions[i]!
      const b = positions[j]!
      const sep = angularSeparation(a.longitudeDeg, b.longitudeDeg)
      for (const def of ASPECT_DEFS) {
        const orb = Math.abs(def.exactAngle - sep)
        if (orb <= def.orb) {
          out.push(makeAspect(a.name, b.name, def, sep))
        }
      }
    }
  }
  return out
}

/** Build a single Aspect value from a def and the actual separation. */
function makeAspect(
  bodyA: WesternBody | AngleName,
  bodyB: WesternBody | AngleName,
  def: AspectDef,
  separation: number,
): Aspect {
  return {
    bodyA,
    bodyB,
    type: def.type,
    exactAngle: def.exactAngle,
    actualSeparation: round(separation, 6),
    orb: round(Math.abs(def.exactAngle - separation), 6),
  }
}

/** Round to n decimal places to keep golden output stable. */
function round(v: number, dp: number): number {
  const f = 10 ** dp
  return Math.round(v * f) / f
}
