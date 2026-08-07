// src/components/GlossaryPopover.tsx — jargon term explainer.
//
// Renders an inline trigger button for one glossary term. On click, opens a
// Modal showing the term's `arti` (layperson meaning) and `analogi` (everyday
// analogy) from src/i18n/glossary.ts. Used in the Dashboard header to explain
// the horizon tlDr jargon and inside DomainCard for domain tlDr lines.
//
// All colors use var(--aka-*) tokens via ui.tsx primitives + inline styles.

import { useState, useCallback } from 'react'
import { Modal } from './ui'
import { GLOSSARY } from '../i18n/glossary'

export interface GlossaryPopoverProps {
  /** Canonical glossary term to look up. */
  term: string
  /** Optional label override; defaults to the term itself. */
  label?: string
}

export function GlossaryPopover({ term, label }: GlossaryPopoverProps): React.ReactNode {
  const [open, setOpen] = useState(false)
  const entry = GLOSSARY.find((e) => e.term === term)
  const onToggle = useCallback(() => setOpen((o) => !o), [])
  const onClose = useCallback(() => setOpen(false), [])

  if (!entry) return null

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="font-mono text-xs underline decoration-dotted"
        style={{ color: 'var(--aka-accent)' }}
      >
        {label ?? term}
      </button>
      <Modal open={open} onClose={onClose} title={entry.term}>
        <p
          className="font-body text-sm"
          style={{ color: 'var(--aka-fg)' }}
        >
          {entry.arti}
        </p>
        <p
          className="mt-3 font-body text-xs italic"
          style={{ color: 'var(--aka-muted)' }}
        >
          {entry.analogi}
        </p>
      </Modal>
    </>
  )
}
