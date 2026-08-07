// @ts-check
/**
 * Plain-word whitelist for `check-jargon.mjs` (rule b).
 *
 * Indonesian layperson vocabulary + the four domain names (Karier, Cinta,
 * Kesehatan, Keuangan) which are intentionally NOT jargon. Every word used
 * inside any glossary `arti`/`analogi` MUST appear here, otherwise the
 * closure rule rejects the gloss.
 *
 * Lowercase only; the checker lowercases tokens before lookup.
 */
export const PLAIN_WORDS = new Set([
  // domain names (plain, not jargon)
  'karier', 'cinta', 'kesehatan', 'keuangan',
  // function words
  'dan', 'atau', 'di', 'ke', 'dari', 'yang', 'ini', 'itu', 'untuk',
  'pada', 'dengan', 'oleh', 'saat', 'sebagai', 'juga', 'satu', 'dua',
  'tiga', 'empat', 'lima', 'tujuh', 'sepuluh', 'dua', 'belas', 'ratus',
  'nol', 'seratus', 'sepuluh', 'tiap', 'setiap', 'selama', 'masa', 'tahun',
  'tahunan', 'hari', 'bulan', 'jam', 'waktu', 'kembali', 'masih', 'lebih',
  'paling', 'sangat', 'sedikit', 'banyak', 'beberapa', 'sebuah', 'sedang',
  'kini', 'sekarang', 'awal', 'depan', 'belakang', 'atas', 'bawah',
  // nouns & verbs used across glossary arti/analogi
  'air', 'akar', 'aktif', 'alam', 'aliran', 'anak', 'anda', 'angka',
  'angkanya', 'antar', 'antara', 'api', 'arah', 'arus', 'astrologi',
  'atap', 'ayah', 'bab', 'bagian', 'bahan', 'baku', 'batas', 'belakang',
  'benda', 'benih', 'benturan', 'berat', 'berganti', 'bergeser',
  'berhadapan', 'berjalan', 'berkah', 'besar', 'bidang', 'bintang',
  'blok', 'buku', 'bumi', 'cabang', 'cahaya', 'cat', 'dalam', 'dasar',
  'datang', 'dekade', 'diberikannya', 'dihitung', 'dilihat', 'dimasukkan',
  'dipetakan', 'dipimpin', 'diri', 'ditentukan', 'efek', 'emosi', 'energi',
  'foto', 'gangguan', 'gigi', 'hidup', 'ibu', 'identitas', 'inti', 'jarak',
  'jenis', 'kamar', 'kantor', 'kayu', 'kecil', 'kehidupan', 'kekuasaan',
  'keluarga', 'kerja', 'ketelitian', 'keyakinan', 'kombinasi', 'kota',
  'kotak', 'kuartal', 'laci', 'lahir', 'lampu', 'langit', 'lemari',
  'lewat', 'logam', 'makin', 'matahari', 'meja', 'melintasi', 'membentuk',
  'memetakan', 'memperhalus', 'memuncak', 'menambah', 'menandai', 'menarik',
  'mendukung', 'menempati', 'menempel', 'menentukan', 'menerangi',
  'mengenai', 'menggambarkan', 'menghabiskan', 'menghadap', 'menguatkan',
  'mengubah', 'menimbulkan', 'menjadi', 'menolak', 'menopang',
  'menunjukkan', 'menurut', 'menyatu', 'menyimpan', 'menyinari',
  'menyoroti', 'mesin', 'mewakili', 'momen', 'musim', 'nama', 'napas',
  'netral', 'nuansa', 'pakar', 'panah', 'panen', 'panjang', 'pasangan',
  'pemilihan', 'pemula', 'pendukung', 'penggaris', 'penyangga', 'peran',
  'pergerakan', 'perhentian', 'perhitungan', 'periode', 'perjalanan',
  'perpaduan', 'pertama', 'peta', 'pintu', 'planet', 'pohon', 'pola',
  'posisi', 'pribadi', 'produktif', 'puluh', 'pusat', 'putaran', 'rapat',
  'rasi', 'rentang', 'riak', 'rintangan', 'roda', 'ruang', 'ruangan',
  'rumah', 'sakit', 'salah', 'saling', 'sampai', 'saudara', 'seberapa',
  'sejak', 'selisih', 'seluruh', 'sementara', 'sependapat', 'sesuatu',
  'seterusnya', 'setuju', 'sidereal', 'siklus', 'sinar', 'sinyal',
  'sistem', 'skala', 'stasiun', 'suara', 'suasana', 'subur', 'sudut',
  'sungai', 'surat', 'tamu', 'tanah', 'tanaman', 'tanda', 'tangan',
  'target', 'tekanan', 'tema', 'tempat', 'tempati', 'tepat', 'terbit',
  'terhadap', 'tetap', 'tiang', 'tidur', 'timur', 'tinggi', 'tingkat',
  'titik', 'toleransi', 'transformasi', 'tropis', 'tumbuh', 'ufuk',
  'ulang', 'unsur', 'utama', 'wadah', 'warna',
  // verbs / connectors appearing in tlDr template phrasing
  'skor', 'menguat', 'perlu', 'hati-hati', 'sistem', 'setuju',
])
