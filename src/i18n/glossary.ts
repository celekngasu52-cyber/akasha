// src/i18n/glossary.ts — astrological glossary for layperson Indonesian.
//
// Single source of truth that `scripts/check-jargon.mjs` validates every
// narrative candidate (including `tlDr`) against. Each term carries:
//   - `term`: the jargon token as it appears in narratives (canonical form).
//   - `arti`: a one-line Indonesian layperson definition using ONLY plain
//     whitelisted words (no other jargon term) so the closure rule passes.
//   - `analogi`: an everyday analogy (also plain words) for UI popovers.
//
// Vocabulary spans the four engines (BaZi, ZiWei, Vedic, Western) plus the
// synthesis layer (scorer/agreement). Domain names (Karier, Cinta,
// Kesehatan, Keuangan) are intentionally NOT jargon — they are plain words.
//
// Closure rule enforced by check-jargon.mjs:
//   (a) a jargon term in narrative MUST have a gloss `(arti)` on first
//       appearance;
//   (b) words inside a gloss must be plain-whitelisted;
//   (c) a term not in this list -> narrative REJECTED (exit 1).

/** One glossary entry. `arti` and `analogi` use only plain words. */
export interface GlossaryEntry {
  /** Canonical jargon token validated by the checker. */
  readonly term: string
  /** Indonesian layperson meaning; plain words only. */
  readonly arti: string
  /** Everyday analogy; plain words only. */
  readonly analogi: string
}

/**
 * Enumerated glossary. Order is stable (engines grouped), not alphabetic,
 * so reviewers can map terms back to their source engine.
 *
 * BaZi (八字) terms — 1..10
 * ZiWei (紫微) terms — 11..18
 * Vedic terms — 19..24
 * Western terms — 25..30
 * Synthesis terms — 31..33
 */
export const GLOSSARY: readonly GlossaryEntry[] = [
  // --- BaZi (八字) ---
  {
    term: 'day master',
    arti: 'Unsur inti diri Anda yang ditentukan oleh hari lahir.',
    analogi: 'Akar pohon yang menopang seluruh cabang kehidupan Anda.',
  },
  {
    term: 'pillar',
    arti: 'Satu pasangan unsur langit dan bumi untuk satu waktu hidup Anda.',
    analogi: 'Empat tiang penyangga rumah: tahun, bulan, hari, dan jam.',
  },
  {
    term: 'gan-zhi',
    arti: 'Pasangan dua unsur: satu dari langit dan satu dari bumi.',
    analogi: 'Kombinasi nama depan dan nama belakang yang membentuk satu identitas.',
  },
  {
    term: 'heavenly stem',
    arti: 'Unsur langit yang mewakili energi yang datang dari atas.',
    analogi: 'Sinar matahari yang menyinari tanaman dari atas.',
  },
  {
    term: 'earthly branch',
    arti: 'Unsur bumi yang mewakili akar dan tempat tumbuh energi.',
    analogi: 'Tanah subur tempat benih tumbuh.',
  },
  {
    term: 'ten gods',
    arti: 'Sepuluh peran unsur terhadap unsur inti diri Anda.',
    analogi: 'Sepuluh peran keluarga: ayah, ibu, saudara, anak, dan seterusnya.',
  },
  {
    term: 'luck pillars',
    arti: 'Periode hidup besar yang berganti setiap sepuluh tahun.',
    analogi: 'Bab-bab dalam sebuah buku kehidupan yang panjang.',
  },
  {
    term: 'five elements',
    arti: 'Lima unsur dasar: kayu, api, tanah, logam, dan air.',
    analogi: 'Lima bahan baku yang membentuk segala sesuatu di alam.',
  },
  {
    term: 'clash',
    arti: 'Benturan dua unsur yang menimbulkan tekanan atau gangguan.',
    analogi: 'Dua arus air yang berhadapan dan memuncak menjadi riak.',
  },
  {
    term: 'combine',
    arti: 'Perpaduan dua unsur yang saling menguatkan atau menyatu.',
    analogi: 'Dua aliran sungai yang menyatu menjadi satu aliran yang lebih besar.',
  },
  // --- ZiWei (紫微) ---
  {
    term: 'palace',
    arti: 'Salah satu dari dua belas ruang yang memetakan bidang hidup Anda.',
    analogi: 'Dua belas kamar dalam rumah, tiap kamar satu tema hidup.',
  },
  {
    term: 'main stars',
    arti: 'Empat belas bintang utama yang menempati ruang-ruang hidup Anda.',
    analogi: 'Empat belas lampu utama yang menerangi kamar-kamar rumah.',
  },
  {
    term: 'auxiliary stars',
    arti: 'Bintang pendukung yang memperhalus atau mengubah efek bintang utama.',
    analogi: 'Lampu tidur kecil yang menambah nuansa di sudut kamar.',
  },
  {
    term: 'sihua',
    arti: 'Empat transformasi: berkah, kekuasaan, nama, dan rintangan.',
    analogi: 'Empat warna cat yang mengubah suasana satu ruangan.',
  },
  {
    term: 'life palace',
    arti: 'Ruang utama yang menggambarkan inti pribadi Anda.',
    analogi: 'Ruang tamu yang pertama dilihat tamu saat masuk rumah.',
  },
  {
    term: 'body palace',
    arti: 'Ruang yang menggambarkan arah hidup Anda di masa dewasa.',
    analogi: 'Kamar kerja tempat Anda menghabiskan waktu paling produktif.',
  },
  {
    term: 'decadal palace',
    arti: 'Ruang aktif selama satu periode sepuluh tahun hidup Anda.',
    analogi: 'Kantor sementara yang Anda tempati selama satu dekade karier.',
  },
  {
    term: 'annual palace',
    arti: 'Ruang aktif yang menyoroti tema satu tahun berjalan.',
    analogi: 'Meja kerja yang diatur ulang setiap awal tahun.',
  },
  // --- Vedic ---
  {
    term: 'rasi',
    arti: 'Rasi bulan sidereal Anda menurut perhitungan bintang tetap.',
    analogi: 'Tanda tangan emosi yang menempel sejak lahir.',
  },
  {
    term: 'nakshatra',
    arti: 'Salah satu dari dua puluh tujuh wadah cahaya bulan.',
    analogi: 'Dua puluh tujuh stasiun perhentian dalam perjalanan bulan.',
  },
  {
    term: 'pada',
    arti: 'Satu dari empat bagian kecil dalam satu wadah cahaya bulan.',
    analogi: 'Satu dari empat kuartal dalam satu blok kota.',
  },
  {
    term: 'dasha',
    arti: 'Periode besar yang dipimpin satu planet dalam siklus hidup.',
    analogi: 'Satu musim panen yang dipimpin satu jenis tanaman utama.',
  },
  {
    term: 'lagna',
    arti: 'Titik terbit di ufuk timur saat Anda lahir.',
    analogi: 'Pintu masuk utama yang menghadap matahari terbit.',
  },
  {
    term: 'ayanamsa',
    arti: 'Selisih tetap antara bintang tetap dan posisi musim.',
    analogi: 'Jarak antara dua skala penggaris yang sedikit bergeser.',
  },
  // --- Western ---
  {
    term: 'natal chart',
    arti: 'Peta langit tropis saat Anda lahir.',
    analogi: 'Foto langit yang diambil tepat saat Anda pertama menarik napas.',
  },
  {
    term: 'houses',
    arti: 'Dua belas bidang kehidupan yang dipetakan dari tempat lahir.',
    analogi: 'Dua belas laci lemari, tiap laci menyimpan satu tema hidup.',
  },
  {
    term: 'aspects',
    arti: 'Sudut antar dua benda langit yang membentuk pola energi.',
    analogi: 'Sudut antar dua roda gigi yang menentukan putaran mesin.',
  },
  {
    term: 'transits',
    arti: 'Pergerakan benda langit hari ini melintasi peta lahir Anda.',
    analogi: 'Awan yang sedang lewat di atas atap rumah Anda sekarang.',
  },
  {
    term: 'solar return',
    arti: 'Momen tahunan saat matahari kembali ke titik lahir Anda.',
    analogi: 'Ulang tahun astrologi yang menandai tema satu tahun ke depan.',
  },
  {
    term: 'orb',
    arti: 'Batas toleransi ketelitian satu sudut antar benda langit.',
    analogi: 'Rentang toleransi panah yang masih dihitung mengenai pusat target.',
  },
  // --- Synthesis ---
  {
    term: 'agreement score',
    arti: 'Angka nol sampai seratus yang menunjukkan seberapa empat sistem sependapat.',
    analogi: 'Suara rapat: makin banyak yang setuju, makin tinggi angkanya.',
  },
  {
    term: 'vote',
    arti: 'Sinyal satu sistem: mendukung, netral, atau menolak satu bidang.',
    analogi: 'Satu surat suara yang dimasukkan ke kotak pemilihan.',
  },
  {
    term: 'weight',
    arti: 'Tingkat keyakinan satu sistem untuk sinyal yang diberikannya.',
    analogi: 'Berat suara: suara pakar dihitung lebih berat dari suara pemula.',
  },
] as const

/** Set of canonical terms for O(1) membership checks. */
export const GLOSSARY_TERMS: ReadonlySet<string> = new Set(
  GLOSSARY.map((e) => e.term),
)

/** Lookup a term's arti. Returns `undefined` if the term is not registered. */
export function artiOf(term: string): string | undefined {
  return GLOSSARY.find((e) => e.term === term)?.arti
}
