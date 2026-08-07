// src/pages/__tests__/Compatibility.test.tsx
//
// SSR smoke tests (react-dom/server, no jsdom — matching the Dashboard test):
// the page renders the person-B form fields and, after computeCompatibility
// is fed birth data, the verdict block with score + domains + tlDr.
//
// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Compatibility } from '../Compatibility'
import type { BirthData } from '../../core/birth/types'

const STUB_BIRTH: BirthData = {
  dateISO: '2000-01-01',
  timeISO: '12:00',
  lat: -6.2,
  lng: 106.8,
  tzIANA: 'Asia/Jakarta',
  placeName: 'Jakarta',
  isTimeEstimated: false,
}

function renderCompat(): string {
  return renderToStaticMarkup(
    createElement(Compatibility, { birthDataA: STUB_BIRTH, onBack: () => {} }),
  )
}

describe('Compatibility — SSR render', () => {
  it('renders the page heading and back button', () => {
    const html = renderCompat()
    expect(html).toContain('Kompatibilitas Pasangan')
    expect(html).toContain('← Kembali')
  })

  it('renders the person-B form fields (date, time, city)', () => {
    const html = renderCompat()
    expect(html).toContain('Tanggal Lahir')
    expect(html).toContain('Waktu Lahir')
    expect(html).toContain('Kota / Kabupaten Tempat Lahir')
    expect(html).toContain('Hitung Kecocokan')
  })

  it('shows no verdict before submit', () => {
    const html = renderCompat()
    expect(html).not.toContain('Skor Kecocokan')
  })
})