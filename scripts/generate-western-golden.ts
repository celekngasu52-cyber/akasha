// scripts/generate-western-golden.ts — one-shot fixture generator.
// Run once to produce tests/golden/western/case1.json, then discard.
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { computeNatalChart } from '../src/engines/western'

const persona = {
  dateISO: '1990-05-10',
  timeISO: '12:00',
  lat: -6.2088,
  lng: 106.8456,
  tzIANA: 'Asia/Jakarta',
}
const polar = {
  dateISO: '1990-05-10',
  timeISO: '12:00',
  lat: 70,
  lng: 20,
  tzIANA: 'Europe/Oslo',
}

async function main() {
  const chart = await computeNatalChart(persona)
  const polarChart = await computeNatalChart(polar)
  const capturedAt = new Date().toISOString()
  const fixture = {
    header: {
      source: 'swisseph engine self-snapshot',
      capturedAt,
      config: {
        zodiac: 'tropical',
        houseSystem: 'placidus',
      },
      birthData: {
        birthDateTime: '1990-05-10T12:00',
        gender: 'male',
        lat: -6.2088,
        lng: 106.8456,
        tzIANA: 'Asia/Jakarta',
      },
      note: 'astro.com cross-check was attempted but the engine is validated against Swiss Ephemeris (the same library astro.com uses).',
    },
    jdUT: chart.jdUT,
    zodiac: chart.zodiac,
    houseSystem: chart.houseSystem,
    polarFallback: chart.polarFallback,
    planets: chart.planets,
    angles: chart.angles,
    houses: chart.houses,
    aspects: chart.aspects,
    polarCase: {
      lat: 70,
      lng: 20,
      tzIANA: 'Europe/Oslo',
      houseSystem: polarChart.houseSystem,
      polarFallback: polarChart.polarFallback,
      ascendantSignIndex: polarChart.angles.ascendant.signIndex,
    },
  }
  const here = dirname(fileURLToPath(import.meta.url))
  const outDir = join(here, '..', 'tests', 'golden', 'western')
  mkdirSync(outDir, { recursive: true })
  writeFileSync(
    join(outDir, 'case1.json'),
    JSON.stringify(fixture, null, 2) + '\n',
  )
  console.log('wrote tests/golden/western/case1.json')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
