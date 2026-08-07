/**
 * Akasha UI primitives — plain React + Tailwind v4, wired to --aka-* tokens.
 *
 * Design language: warm archival manuscript. Sharp 2px borders, hard offset
 * shadows (no blur, no xl blur utility), single dominant ochre hue. No
 * color stops, no frosted-glass surfaces, no backdrop-blur. All colors
 * reference the tokens defined in src/theme.css.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect, useCallback } from 'react'

/* ---- helpers ---- */

type ClassValue = string | false | null | undefined

function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(' ')
}

/* ---- Button ---- */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wide ' +
  'border-2 transition-colors duration-150 focus:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed'

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-fg border-accent hover:bg-accent-soft hover:text-fg',
  secondary:
    'bg-surface text-fg border-border-strong hover:bg-surface-2 hover:border-accent',
  ghost:
    'bg-transparent text-fg border-transparent hover:bg-surface-2 hover:border-border',
  danger:
    'bg-danger text-fg border-danger hover:bg-accent-soft hover:border-danger',
}

const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: 'text-xs px-3 py-1.5 rounded-sm',
  md: 'text-sm px-4 py-2 rounded',
  lg: 'text-base px-6 py-3 rounded',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      className={cn(BUTTON_BASE, BUTTON_VARIANT[variant], BUTTON_SIZE[size], className)}
      style={{
        // hard offset shadow (no xl blur utility)
        boxShadow: 'var(--aka-shadow-sm)',
      }}
      {...rest}
    />
  )
}

/* ---- Card ---- */

interface CardProps {
  children: ReactNode
  className?: string
  /** Raised cards use surface-2 + the stronger offset shadow. */
  raised?: boolean
}

export function Card({ children, className, raised = false }: CardProps): ReactNode {
  return (
    <div
      className={cn(
        'bg-surface border-2 border-border rounded p-5',
        raised && 'bg-surface-2 border-border-strong',
        className,
      )}
      style={raised ? { boxShadow: 'var(--aka-shadow)' } : { boxShadow: 'var(--aka-shadow-sm)' }}
    >
      {children}
    </div>
  )
}

/* ---- Section ---- */

interface SectionProps {
  children: ReactNode
  className?: string
  /** Optional section heading rendered in the display serif. */
  title?: string
  /** Optional eyebrow label above the title (mono, uppercase). */
  eyebrow?: string
}

export function Section({ children, className, title, eyebrow }: SectionProps): ReactNode {
  return (
    <section className={cn('mx-auto w-full max-w-3xl py-8', className)}>
      {(eyebrow || title) && (
        <header className="mb-6 border-b-2 border-border pb-4">
          {eyebrow && (
            <p
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: 'var(--aka-accent)' }}
            >
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 className="mt-1 font-display text-2xl text-fg">{title}</h2>
          )}
        </header>
      )}
      {children}
    </section>
  )
}

/* ---- Badge ---- */

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger'

interface BadgeProps {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-muted border-border',
  accent: 'bg-accent-soft text-accent border-accent',
  success: 'bg-surface-2 text-success border-success',
  warning: 'bg-surface-2 text-warning border-warning',
  danger: 'bg-surface-2 text-danger border-danger',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 border px-2 py-0.5',
        'font-mono text-xs uppercase tracking-wide rounded-sm',
        BADGE_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---- Tabs ---- */

interface TabItem {
  id: string
  label: string
}

interface TabsProps {
  items: TabItem[]
  value: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ items, value, onChange, className }: TabsProps): ReactNode {
  return (
    <div
      className={cn('flex border-b-2 border-border', className)}
      role="tablist"
    >
      {items.map((item) => {
        const active = item.id === value
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              'px-4 py-2 font-mono text-sm uppercase tracking-wide',
              'border-b-2 -mb-0.5 transition-colors',
              active
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-fg hover:border-border',
            )}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---- Modal ---- */

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  /** Optional title rendered in the display serif. */
  title?: string
}

export function Modal({ open, onClose, children, className, title }: ModalProps): ReactNode | null {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [open, handleKey])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{ backgroundColor: 'var(--aka-bg)', opacity: 0.85 }}
    >
      <div
        className={cn(
          'w-full max-w-lg bg-surface border-2 border-border-strong rounded p-6',
          className,
        )}
        style={{ boxShadow: 'var(--aka-shadow)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <header className="mb-4 flex items-center justify-between border-b-2 border-border pb-3">
            <h3 className="font-display text-xl text-fg">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Tutup"
              className="font-mono text-muted hover:text-fg"
            >
              ✕
            </button>
          </header>
        )}
        {children}
      </div>
    </div>
  )
}

/* ---- Skeleton ---- */

interface SkeletonProps {
  className?: string
  /** Width in CSS units; defaults to 100%. */
  width?: string
  /** Height in CSS units; defaults to 1rem. */
  height?: string
}

export function Skeleton({ className, width = '100%', height = '1rem' }: SkeletonProps): ReactNode {
  return (
    <div
      className={cn(
        'bg-surface-2 border border-border rounded',
        className,
      )}
      style={{
        width,
        height,
        // gentle pulse, no gradient — a tint/shade fade of the surface token
        animation: 'aka-skeleton-pulse 1.6s ease-in-out infinite',
      }}
    />
  )
}
