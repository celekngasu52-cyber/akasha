// src/pages/Collection.tsx — saved-profile library ("Koleksi").
//
// Reads the localStorage collection (profileStore) and renders one card per
// saved chart. Cards open the dashboard for that profile and each card has a
// delete action. Local-first: nothing leaves the browser. SSR-safe: the
// server render starts from the empty state.

import { useState } from 'react'
import type { BirthData } from '../core/birth'
import { Section, Card, Button } from '../components/ui'
import {
  loadProfiles,
  deleteProfile,
  profileKey,
} from '../lib/profileStore'

export interface CollectionProps {
  /** Open a saved profile in the dashboard. */
  onOpen: (birthData: BirthData) => void
  /** Start a fresh birth-data entry. */
  onNew: () => void
}

export function Collection({ onOpen, onNew }: CollectionProps): React.ReactNode {
  const [profiles, setProfiles] = useState<readonly BirthData[]>(() =>
    loadProfiles(),
  )

  return (
    <Section eyebrow="Arsip" title="Koleksi Profil">
      {profiles.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 p-6 text-center">
          <p className="font-body text-base">
            Belum ada profil tersimpan. Simpan dari halaman Dashboard untuk
            membangun arsip ramalan keluarga.
          </p>
          <Button onClick={onNew}>Input data lahir baru</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {profiles.map((p) => (
            <Card key={profileKey(p)} className="flex flex-col gap-2">
              <h3
                className="font-display text-lg"
                style={{ color: 'var(--aka-fg)' }}
              >
                {p.placeName}
              </h3>
              <p
                className="font-mono text-sm"
                style={{ color: 'var(--aka-muted)' }}
              >
                {p.dateISO} · {p.timeISO ?? 'jam tidak diketahui'} · {p.tzIANA}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => onOpen(p)}>
                  Buka
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setProfiles(deleteProfile(profileKey(p)))}
                >
                  Hapus
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Section>
  )
}
