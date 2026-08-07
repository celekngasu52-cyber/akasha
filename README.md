# Akasha

Mesin astrologi multi-sistem dengan lapisan sintesis. Menggabungkan
**Bazi** (Four Pillars Tiongkok), **Vedic** (Jyotish India),
**Western** (tropical), dan **Ziwei Doushu** menjadi satu analisis
terpadu yang saling melengkapi, bukan saling bersaing.

Perhitungan posisi planet memakai Swiss Ephemeris untuk akurasi
astronomis, ayanamsa Lahiri untuk sistem sidereal, dan kalender
lunar Tiongkok via lunar-javascript.

---

## Fitur / Features

- Empat sistem astrologi dalam satu pipeline: Bazi, Vedic, Western, Ziwei
- Lapisan sintesis yang menyilangkan hasil antar sistem
- Swiss Ephemeris untuk presisi kalkulasi planet dan rumah (houses)
- Antarmuka Indonesia-first, dirancang untuk pengguna awam
- Dashboard interaktif dengan panel "Kenapa?" untuk transparansi reasoning

---

## Cara Pakai / Getting Started

### Prasyarat

- Node.js 18+ dan npm
- Git

### Instalasi

```bash
git clone <repo-url> akasha
cd akasha
npm install
```

### Menjalankan Dev Server

```bash
npm run dev
```

Buka browser ke alamat yang ditampilkan Vite (biasanya
`http://localhost:5173`).

### Menjalankan Tests

```bash
npm test
```

### Build Produksi

```bash
npm run build
```

Hasil build ada di folder `dist/`. Preview build lokal:

```bash
npm run preview
```

---

## Demo

Setelah dev server berjalan, buka `http://localhost:5173` di browser.
Masukkan data lahir (tanggal, waktu, tempat) pada halaman input, lalu
lihat hasil analisis di dashboard.

> Screenshot demo akan ditambahkan setelah halaman result final
> (todo 17) di-wire ke pipeline nyata.

---

## Tech Stack

| Bagian         | Teknologi                        |
|----------------|----------------------------------|
| Build tool     | Vite                             |
| UI framework   | React 19                         |
| Bahasa         | TypeScript (strict)              |
| Styling        | Tailwind CSS v4                  |
| Testing        | Vitest + @testing-library        |
| Linter         | Oxlint                           |
| Ephemeris      | swisseph-wasm (Swiss Ephemeris)  |
| Kalender lunar | lunar-javascript                 |

---

## Disclaimer

Akasha dibuat untuk tujuan **hiburan dan refleksi pribadi**.

Hasil analisis astrologi di proyek ini bukan nasihat profesional,
bukan pengganti konsultasi medis, psikologis, hukum, atau keuangan.
Astrologi adalah sistem simbolik dan kultural, bukan ilmu sains yang
terverifikasi. Keputusan penting dalam hidup Anda sebaiknya tidak
diambil semata-mata berdasarkan output mesin ini.

Pengguna bertanggung jawab penuh atas interpretasi dan tindakan
yang dilakukan berdasarkan informasi dari Akasha.

---

## Lisensi / License

**Source code** proyek ini dilisensikan di bawah **GNU General Public
License v3.0 (GPL-3.0)**. Lihat file [LICENSE](./LICENSE) untuk teks
lengkap.

### Lisensi Data Ephemeris (PENTING)

File data Swiss Ephemeris (`.se1`) yang digunakan proyek ini
dilisensikan oleh **Astrodienst** untuk **penggunaan non-komersial
saja**. Penggunaan komersial atas file data tersebut memerlukan
lisensi terpisah dari Astrodienst.

Lihat file [NOTICE](./NOTICE) untuk detail atribusi dan batasan
lisensi semua komponen pihak ketiga.

### Kredit Style / Design Credits

Sistem design tokens dan palet warna proyek ini terinspirasi dari
metodologi **ui-ux-pro-max-skill** (lisensi MIT). Lihat [NOTICE](./NOTICE)
untuk atribusi lengkap.

---

## Kontribusi / Contributing

Pull request diterima. Pastikan `npm test` lulus dan tidak ada
baris yang melebihi 100 karakter (`node check-line-length.mjs`)
sebelum commit.

---

## Atribusi / Acknowledgements

- [Astrodienst Swiss Ephemeris](https://www.astro.com/swisseph/) -
  data dan software ephemeris
- [lunar-javascript](https://github.com/6tail/lunar-javascript) by
  6tail - kalender lunar Tiongkok
- [swisseph-wasm](https://github.com/prolaxu/swisseph-wasm) by
  prolaxu - port WebAssembly Swiss Ephemeris
- [ui-ux-pro-max-skill](./NOTICE) - metodologi design system
