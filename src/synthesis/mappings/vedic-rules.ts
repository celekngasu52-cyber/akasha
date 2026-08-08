// src/synthesis/mappings/vedic-rules.ts — Vedic engine rule factory (4 domains).
//
// Extracted from the original mappings.ts as a mechanical split (todo 1 F2
// debt). Pure and deterministic: same Chart4 slice -> same RuleResult.
// Public types live in ./types.ts.

import type { Chart4, Domain, RuleResult, Vote } from './types'

// ---------------------------------------------------------------------------
// Vedic helpers — benefic/malefic + house occupancy
// ---------------------------------------------------------------------------

const VEDIC_BENEFICS = new Set(['jupiter', 'venus', 'mercury', 'moon'])
const VEDIC_MALEFICS = new Set(['saturn', 'mars', 'sun', 'rahu', 'ketu'])

function vedicHouseIndex(longitudeDeg: number, ascDeg: number): number {
  const diff = ((longitudeDeg - ascDeg) % 360 + 360) % 360
  return Math.floor(diff / 30) + 1
}

// Domain → Vedic house emphasis (1-indexed houses)
// Karier: 10th (karma), 6th (service), 2nd + 11th (income)
// Cinta: 7th (marriage), 5th (romance)
// Kesehatan: 1st (body), 6th (disease), 8th (longevity)
// Keuangan: 2nd (wealth), 11th (gains), 9th (fortune)
function vedicDomainHouses(domain: Domain): readonly number[] {
  switch (domain) {
    case 'Karier': return [10, 6, 11]
    case 'Cinta': return [7, 5]
    case 'Kesehatan': return [1, 6, 8]
    case 'Keuangan': return [2, 11, 9]
  }
}

// ---------------------------------------------------------------------------
// Vedic rules (4)
// ---------------------------------------------------------------------------

function vedicRule(domain: Domain): (chart: Chart4) => RuleResult {
  return (chart: Chart4): RuleResult => {
    const vedic = chart.vedic
    const asc = vedic.lagna.longitudeDeg
    const houses = vedicDomainHouses(domain)
    let benefics = 0
    let malefics = 0
    for (const p of vedic.planets) {
      const h = vedicHouseIndex(p.longitudeDeg, asc)
      if (!houses.includes(h)) continue
      if (VEDIC_BENEFICS.has(p.body)) benefics++
      else if (VEDIC_MALEFICS.has(p.body)) malefics++
    }
    const net = benefics - malefics
    const vote: Vote = net >= 2 ? 1 : net <= -2 ? -1 : 0
    const weight = Math.min(1, (benefics + malefics) / 4)
    const alasan =
      net >= 2
        ? `Rumah ${houses.join('/')} ditempati ${benefics} benefik.`
        : net <= -2
          ? `Rumah ${houses.join('/')} ditempati ${malefics} malefik.`
          : `Rumah ${houses.join('/')} seimbang (${benefics} benefik, ${malefics} malefik).`
    return { engine: 'Vedic', domain, vote, weight, alasanSingkat: alasan }
  }
}

/** The Vedic rule for a given domain (factory — one closure per domain). */
export const VEDIC_RULES: Record<Domain, (chart: Chart4) => RuleResult> = {
  Karier: vedicRule('Karier'),
  Cinta: vedicRule('Cinta'),
  Kesehatan: vedicRule('Kesehatan'),
  Keuangan: vedicRule('Keuangan'),
}
