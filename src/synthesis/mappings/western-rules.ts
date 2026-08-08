// src/synthesis/mappings/western-rules.ts — Western engine rule factory (4 domains).
//
// Extracted from the original mappings.ts as a mechanical split (todo 1 F2
// debt). Pure and deterministic: same Chart4 slice -> same RuleResult.
// Public types live in ./types.ts.

import type { Chart4, Domain, RuleResult, Vote } from './types'

// ---------------------------------------------------------------------------
// Western helpers — aspect + house occupancy
// ---------------------------------------------------------------------------

const WESTERN_BENEFICS = new Set(['venus', 'jupiter'])
const WESTERN_MALEFICS = new Set(['saturn', 'mars'])

function westernHouseIndex(longitudeDeg: number, ascDeg: number): number {
  const diff = ((longitudeDeg - ascDeg) % 360 + 360) % 360
  return Math.floor(diff / 30) + 1
}

function westernDomainHouses(domain: Domain): readonly number[] {
  switch (domain) {
    case 'Karier': return [10, 6, 2]
    case 'Cinta': return [7, 5]
    case 'Kesehatan': return [1, 6, 12]
    case 'Keuangan': return [2, 8, 11]
  }
}

// ---------------------------------------------------------------------------
// Western rules (4)
// ---------------------------------------------------------------------------

function westernRule(domain: Domain): (chart: Chart4) => RuleResult {
  return (chart: Chart4): RuleResult => {
    const w = chart.western
    const asc = w.angles.ascendant.longitudeDeg
    const houses = westernDomainHouses(domain)
    const houseOf = (name: string): number =>
      westernHouseIndex(
        w.planets.find((p) => p.name === name)?.longitudeDeg ?? 0,
        asc,
      )
    let benefics = 0
    let malefics = 0
    let goodAspects = 0
    for (const p of w.planets) {
      const h = westernHouseIndex(p.longitudeDeg, asc)
      if (!houses.includes(h)) continue
      if (WESTERN_BENEFICS.has(p.name as string)) benefics++
      else if (WESTERN_MALEFICS.has(p.name as string)) malefics++
    }
    for (const a of w.aspects) {
      const isGood = a.type === 'trine' || a.type === 'sextile'
      const hitsDomain = houses.some(
        (h) => houseOf(String(a.bodyA)) === h || houseOf(String(a.bodyB)) === h,
      )
      if (isGood && hitsDomain && a.orb <= 6) goodAspects++
    }
    const net = benefics - malefics + goodAspects * 0.5
    const vote: Vote = net >= 2 ? 1 : net <= -1 ? -1 : 0
    const weight = Math.min(1, (benefics + malefics + goodAspects) / 5)
    const alasan =
      net >= 2
        ? `Rumah ${houses.join('/')} ditempati ${benefics} benefik` +
          ` dengan ${goodAspects} aspek harmonis.`
        : net <= -1
          ? `Rumah ${houses.join('/')} ditempati ${malefics} malefik.`
          : `Rumah ${houses.join('/')} seimbang (${benefics} benefik, ${malefics} malefik).`
    return { engine: 'Western', domain, vote, weight, alasanSingkat: alasan }
  }
}

/** The Western rule for a given domain (factory — one closure per domain). */
export const WESTERN_RULES: Record<Domain, (chart: Chart4) => RuleResult> = {
  Karier: westernRule('Karier'),
  Cinta: westernRule('Cinta'),
  Kesehatan: westernRule('Kesehatan'),
  Keuangan: westernRule('Keuangan'),
}
