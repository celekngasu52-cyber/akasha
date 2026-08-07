// src/pages/__tests__/Collection.test.tsx
//
// Verifies the "Koleksi" saved-profile page via react-dom/server static
// markup (no jsdom). In the node env the localStorage-backed store is
// SSR-safe and returns [], so the render starts from the empty state.
//
// @vitest-environment node

import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { Collection } from '../Collection'

function renderCollection(): string {
  return renderToStaticMarkup(
    createElement(Collection, { onOpen: () => {}, onNew: () => {} }),
  )
}

describe('Collection — Koleksi Profil', () => {
  it('renders the collection heading', () => {
    const html = renderCollection()
    expect(html).toContain('Koleksi Profil')
  })

  it('renders an empty state with a CTA when no profiles are stored', () => {
    const html = renderCollection()
    expect(html).toContain('Belum ada profil tersimpan')
    expect(html).toContain('Input data lahir baru')
  })

  it('renders without throwing in an SSR-safe node env', () => {
    expect(() => renderCollection()).not.toThrow()
  })
})