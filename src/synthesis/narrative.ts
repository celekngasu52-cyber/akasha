// src/synthesis/narrative.ts — template-driven narrative synthesis.
//
// Produces a per-horizon narrative whose FIRST line is a fixed-template
// `tlDr` built from the scorer's agreement summary. No LLM, fully
// deterministic: same input -> same output. The `tlDr` template is:
//
//   "<Horizon> ini: persetujuan <Label> — <TopDomain> teratas (skor <S>),
//    <BottomDomain> paling perlu hati-hati (skor <s>)."
//
// where Label in {Tinggi, Sedang, Rendah} and TopDomain/BottomDomain are
// domain names from the fixed vocabulary {Karier, Cinta, Kesehatan,
// Keuangan}. The tlDr uses only plain words so it passes check-jargon.mjs
// (it contains no jargon term at all, hence needs no gloss).
//
// Consumes the scorer (todo 11) via a small adapter interface so this module
// does NOT hard-depend on todo 11's exact types. Todo 13 consumes this.

/** The four domain names (decision aligned with todo 11). */
export const DOMAIN_NAMES = [
  'Karier',
  'Cinta',
  'Kesehatan',
  'Keuangan',
] as const
export type DomainName = (typeof DOMAIN_NAMES)[number]

/** Agreement label tiers. */
export const AGREEMENT_LABELS = ['Tinggi', 'Sedang', 'Rendah'] as const
export type AgreementLabel = (typeof AGREEMENT_LABELS)[number]

/** Which horizon the narrative covers. */
export const HORIZONS = ['harian', 'mingguan', 'bulanan', 'tahunan'] as const
export type Horizon = (typeof HORIZONS)[number]

/** A single domain's scored outcome from the scorer. */
export interface DomainScore {
  /** Domain name; must be one of DOMAIN_NAMES. */
  readonly name: DomainName
  /** 0..100 agreement score. */
  readonly score: number
}

/**
 * Adapter input: the minimal scorer summary the narrative needs. Decoupled
 * from todo 11's concrete types so this module can ship before/after the
 * scorer without type churn.
 */
export interface NarrativeInput {
  /** Horizon this narrative describes. */
  readonly horizon: Horizon
  /** Agreement tier across the engines. */
  readonly agreementLabel: AgreementLabel
  /** Highest-scoring domain. */
  readonly topDomain: DomainScore
  /** Lowest-scoring domain. */
  readonly bottomDomain: DomainScore
}

const HORIZON_LABEL: Readonly<Record<Horizon, string>> = Object.freeze({
  harian: 'Hari',
  mingguan: 'Minggu',
  bulanan: 'Bulan',
  tahunan: 'Tahun',
})

const DOMAIN_SET: ReadonlySet<string> = new Set(DOMAIN_NAMES)
const LABEL_SET: ReadonlySet<string> = new Set(AGREEMENT_LABELS)
const HORIZON_SET: ReadonlySet<string> = new Set(HORIZONS)

function assertDomain(name: string, ctx: string): asserts name is DomainName {
  if (!DOMAIN_SET.has(name)) {
    throw new RangeError(
      `${ctx}: unknown domain "${name}"; expected one of ${DOMAIN_NAMES.join(', ')}`,
    )
  }
}

function assertLabel(label: string): asserts label is AgreementLabel {
  if (!LABEL_SET.has(label)) {
    throw new RangeError(
      `agreementLabel: unknown "${label}"; expected one of ${AGREEMENT_LABELS.join(', ')}`,
    )
  }
}

function assertHorizon(h: string): asserts h is Horizon {
  if (!HORIZON_SET.has(h)) {
    throw new RangeError(
      `horizon: unknown "${h}"; expected one of ${HORIZONS.join(', ')}`,
    )
  }
}

function assertScore(score: number, ctx: string): void {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError(`${ctx}: score ${score} out of range 0..100`)
  }
}

/**
 * Build the fixed-template tlDr (one lay sentence). Pure and deterministic.
 *
 * Shape: "<Horizon> ini: persetujuan <Label> — <Top> teratas (skor <S>),
 * <Bottom> paling perlu hati-hati (skor <s>)."
 */
export function buildTlDr(input: NarrativeInput): string {
  assertHorizon(input.horizon)
  assertLabel(input.agreementLabel)
  assertDomain(input.topDomain.name, 'topDomain.name')
  assertDomain(input.bottomDomain.name, 'bottomDomain.name')
  assertScore(input.topDomain.score, 'topDomain.score')
  assertScore(input.bottomDomain.score, 'bottomDomain.score')
  const h = HORIZON_LABEL[input.horizon]
  const { agreementLabel: label } = input
  const top = input.topDomain.name
  const topScore = Math.round(input.topDomain.score)
  const bottom = input.bottomDomain.name
  const bottomScore = Math.round(input.bottomDomain.score)
  return (
    `${h} ini: persetujuan ${label} — ${top} teratas (skor ${topScore}), ` +
    `${bottom} paling perlu hati-hati (skor ${bottomScore}).`
  )
}

/**
 * Build a full per-horizon narrative: the tlDr first line, then a short
 * plain-language body. The body intentionally avoids jargon terms so the
 * whole narrative passes check-jargon.mjs without needing glosses. When a
 * future todo adds richer jargon-bearing bodies, those terms must be
 * glossed on first appearance per the closure rule.
 */
export function buildNarrative(input: NarrativeInput): string {
  const tlDr = buildTlDr(input)
  const h = HORIZON_LABEL[input.horizon]
  const top = input.topDomain.name
  const bottom = input.bottomDomain.name
  const body =
    `${h} ini, ${top} tampil paling menonjol, ` +
    `sementara ${bottom} layak jadi fokus perhatian. ` +
    `Gunakan momen ini untuk menyeimbangkan keduanya.`
  return `${tlDr}\n${body}`
}
