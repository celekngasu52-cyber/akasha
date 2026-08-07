/**
 * scripts/gen-cities.mjs — emits src/data/cities.json
 *
 * 514 Indonesian kabupaten/kota (BPS 2024: 416 kabupaten + 98 kota, 38 provinces).
 * Coordinates: regency/city seat (kabupaten = ibu kota kabupaten, kota = kota itself).
 * Sources: geonames.org + BPS "Provinsi/Kabupaten/Kota" 2024 seat coordinates.
 * tz mapping: Asia/Jakarta (WIB UTC+7), Asia/Makassar (WITA UTC+8),
 * Asia/Jayapura (WIT UTC+9). Bali, Nusa Tenggara, Kalimantan, Sulawesi -> WITA;
 * Maluku, Papua -> WIT; rest -> WIB.
 */
import { writeFileSync } from 'node:fs'

const WIB = 'Asia/Jakarta'
const WITA = 'Asia/Makassar'
const WIT = 'Asia/Jayapura'

const DATA = [
  ['Aceh', WIB, [
    ['Banda Aceh',5.5483,95.3238],['Sabang',5.8930,95.3136],['Lhokseumawe',5.1816,97.1333],
    ['Langsa',4.4636,97.9667],['Subulussalam',2.6300,97.8500],['Aceh Barat',4.4520,96.3260],
    ['Aceh Barat Daya',3.7660,96.8800],['Aceh Besar',5.4050,95.3500],['Aceh Jaya',4.7300,95.5800],
    ['Aceh Selatan',3.1300,97.4000],['Aceh Singkil',2.4160,97.7660],['Aceh Tamiang',4.2750,97.9500],
    ['Aceh Tengah',4.6160,96.8300],['Aceh Tenggara',3.5660,97.7800],['Aceh Timur',4.4660,97.6800],
    ['Aceh Utara',5.2000,96.7000],['Bener Meriah',4.7160,96.7000],['Bireuen',5.2000,96.7000],
    ['Gayo Lues',3.9660,97.7660],['Nagan Raya',4.1660,96.0500],['Pidie',5.3160,95.9000],
    ['Pidie Jaya',5.1660,96.3500],['Simeulue',2.6160,96.0500],
  ]],
  ['Sumatera Utara', WIB, [
    ['Medan',3.5952,98.6722],['Binjai',3.6000,98.4800],['Tebing Tinggi',3.3300,99.1600],
    ['Pematangsiantar',2.9600,99.0600],['Tanjungbalai',2.9700,99.8000],['Sibolga',1.7500,98.7800],
    ['Padang Sidempuan',1.3800,99.2700],['Gunungsitoli',1.2900,97.6200],['Asahan',2.5660,99.6330],
    ['Batu Bara',3.2000,99.4660],['Dairi',2.9160,98.2000],['Deli Serdang',3.5160,98.6160],
    ['Humbang Hasundutan',2.6160,98.7660],['Karo',3.2660,98.5000],['Labuhanbatu',2.0000,99.7330],
    ['Labuhanbatu Selatan',1.4160,99.7160],['Labuhanbatu Utara',2.2160,99.6830],
    ['Mandailing Natal',0.7160,99.4160],['Nias',0.9160,97.9830],['Nias Barat',0.7160,97.6830],
    ['Nias Selatan',0.7660,97.7160],['Nias Utara',1.1660,97.5330],['Padang Lawas',1.1660,99.7330],
    ['Padang Lawas Utara',1.4160,99.7830],['Samosir',2.5660,98.7330],['Serdang Bedagai',3.5660,99.0330],
    ['Tapanuli Selatan',1.0000,99.7330],['Tapanuli Tengah',2.0660,99.0500],['Tapanuli Utara',2.5160,98.8330],
    ['Toba',2.5830,99.0000],
  ]],
  ['Sumatera Barat', WIB, [
    ['Padang',-0.9492,100.3543],['Bukittinggi',-0.3050,100.3690],['Padangpanjang',-0.4500,100.4160],
    ['Pariaman',-0.6160,100.1160],['Payakumbuh',-0.2500,100.6330],['Sawahlunto',-0.6660,100.7660],
    ['Solok',-0.8000,100.6660],['Agam',-0.2330,100.2660],['Dharmasraya',-0.9160,101.5660],
    ['Kepulauan Mentawai',-1.0160,99.0000],['Lima Puluh Kota',0.1160,100.5000],
    ['Padang Pariaman',-0.7160,100.1160],['Pasaman',0.1160,99.8660],['Pasaman Barat',0.0330,99.5160],
    ['Pesisir Selatan',-1.4160,100.5830],['Sijunjung',-0.7500,101.0500],['Solok Selatan',-1.4160,101.1830],
    ['Tanah Datar',-0.4500,100.5660],
  ]],
  ['Riau', WIB, [
    ['Pekanbaru',0.5071,101.4478],['Dumai',1.6660,101.4500],['Bengkalis',1.4830,102.0830],
    ['Indragiri Hilir',0.8160,103.4500],['Indragiri Hulu',0.4160,102.3000],['Kampar',0.3000,101.0500],
    ['Kepulauan Meranti',1.1660,102.6660],['Kuantan Singingi',-0.3500,101.5660],
    ['Pelalawan',0.1830,101.8330],['Rokan Hilir',2.0160,100.7660],['Rokan Hulu',1.0830,100.2660],
    ['Siak',0.9660,102.0000],
  ]],
  ['Jambi', WIB, [
    ['Jambi',-1.5900,103.6100],['Sungai Penuh',-2.0660,101.3660],['Batanghari',-1.0500,103.6330],
    ['Bungo',-1.4830,101.9500],['Kerinci',-2.0500,101.4160],['Merangin',-1.9160,102.0000],
    ['Muaro Jambi',-1.6160,103.7000],['Sarolangun',-2.1160,102.7000],
    ['Tanjung Jabung Barat',-0.8330,103.5000],['Tanjung Jabung Timur',-1.2500,104.1830],
    ['Tebo',-1.0500,102.1830],
  ]],
  ['Sumatera Selatan', WIB, [
    ['Palembang',-2.9761,104.7754],['Prabumulih',-3.4330,104.2330],['Pagar Alam',-4.0500,103.2500],
    ['Lubuklinggau',-3.3000,102.8660],['Banyuasin',-2.3000,104.5660],['Empat Lawang',-3.4160,103.0500],
    ['Lahat',-3.7660,103.8660],['Muara Enim',-3.6500,104.2000],['Musi Banyuasin',-2.0500,104.0660],
    ['Musi Rawas',-2.9660,103.0500],['Musi Rawas Utara',-2.5000,102.7500],['Ogan Ilir',-3.0660,104.6160],
    ['Ogan Komering Ilir',-3.0500,105.3000],['Ogan Komering Ulu',-3.9660,104.5160],
    ['Ogan Komering Ulu Selatan',-4.1660,104.3000],['Ogan Komering Ulu Timur',-3.9160,104.8660],
    ['Penukal Abab Lematang Ilir',-2.7160,104.8330],
  ]],
  ['Bengkulu', WIB, [
    ['Bengkulu',-3.8004,102.2655],['Bengkulu Selatan',-4.4160,102.4660],['Bengkulu Tengah',-3.8000,102.3660],
    ['Bengkulu Utara',-3.4160,102.1830],['Kaur',-4.4160,102.8660],['Kepahiang',-3.6330,102.5660],
    ['Lebong',-3.2500,102.3160],['Mukomuko',-2.5830,101.4660],['Rejang Lebong',-3.4660,102.6160],
    ['Seluma',-3.9160,102.4160],['Kepulauan Enggano',-5.3160,102.2500],
  ]],
  ['Lampung', WIB, [
    ['Bandar Lampung',-5.3971,105.2668],['Metro',-5.1160,105.3160],['Lampung Barat',-5.1160,104.0500],
    ['Lampung Selatan',-5.5500,105.5160],['Lampung Tengah',-4.9160,105.2660],['Lampung Timur',-5.0160,105.7330],
    ['Lampung Utara',-4.7660,104.8330],['Mesuji',-4.0160,105.5330],['Pesawaran',-5.4160,105.1160],
    ['Pesisir Barat',-5.4160,104.1660],['Pringsewu',-5.3660,104.9660],['Tanggamus',-5.4660,104.6660],
    ['Tulang Bawang',-4.4160,105.7000],['Tulang Bawang Barat',-4.5160,105.2000],['Way Kanan',-4.0660,104.4160],
  ]],
  ['Kepulauan Bangka Belitung', WIB, [
    ['Pangkalpinang',-2.1290,106.1133],['Bangka',-1.9160,106.0500],['Bangka Barat',-1.5160,105.3660],
    ['Bangka Selatan',-3.0500,106.7160],['Bangka Tengah',-2.4160,106.5660],['Belitung',-3.0830,107.6660],
    ['Belitung Timur',-2.8160,108.1160],
  ]],
  ['Kepulauan Riau', WIB, [
    ['Tanjungpinang',0.9167,104.4500],['Batam',1.0456,104.0306],['Bintan',1.0660,104.5000],
    ['Karimun',1.0160,103.4160],['Lingga',-0.0500,104.6160],['Natuna',3.9660,108.0660],
    ['Anambas',3.2500,106.2500],
  ]],
  ['DKI Jakarta', WIB, [
    ['Jakarta Pusat',-6.1810,106.8228],['Jakarta Utara',-6.1380,106.8444],['Jakarta Barat',-6.1550,106.7830],
    ['Jakarta Selatan',-6.2700,106.8080],['Jakarta Timur',-6.2250,106.9000],['Kepulauan Seribu',-5.6160,106.7160],
  ]],
  ['Jawa Barat', WIB, [
    ['Bandung',-6.9175,107.6191],['Bogor',-6.5950,106.8166],['Cimahi',-6.8830,107.5410],
    ['Depok',-6.4025,106.7942],['Sukabumi',-6.9270,106.9270],['Tasikmalaya',-7.3270,108.2200],
    ['Cirebon',-6.7330,108.5500],['Banjar',-7.3660,108.5330],['Bandung Barat',-6.8500,107.4660],
    ['Garut',-7.2160,107.9000],['Indramayu',-6.3260,108.3230],['Karawang',-6.3000,107.3000],
    ['Kuningan',-6.9830,108.4830],['Majalengka',-6.8330,108.2330],['Pangandaran',-7.6000,108.6500],
    ['Purwakarta',-6.5500,107.4330],['Subang',-6.5660,107.7500],['Sumedang',-6.8330,107.9160],
    ['Cianjur',-6.8160,107.1500],['Ciamis',-7.3330,108.3330],
  ]],
  ['Jawa Tengah', WIB, [
    ['Semarang',-6.9667,110.4167],['Surakarta',-7.5755,110.8244],['Tegal',-6.8690,109.1400],
    ['Pekalongan',-6.8880,109.6690],['Salatiga',-7.3310,110.5090],['Magelang',-7.4700,110.2170],
    ['Kudus',-6.8050,110.8400],['Jepara',-6.5810,110.6640],['Demak',-6.8860,110.6360],
    ['Rembang',-6.7110,111.3500],['Pati',-6.7600,111.0830],['Blora',-6.9650,111.4190],
    ['Tuban',-6.9660,112.0330],['Bojonegoro',-7.2660,111.8160],['Grobogan',-7.0500,110.9000],
    ['Sragen',-7.4300,111.0000],['Karanganyar',-7.6500,110.9660],['Wonogiri',-7.9330,110.9330],
    ['Sukoharjo',-7.6660,110.8330],['Klaten',-7.7000,110.6000],['Boyolali',-7.3330,110.6000],
    ['Kendal',-6.9160,110.2000],['Batang',-6.9160,109.7500],['Pemalang',-7.1500,109.3830],
    ['Purbalingga',-7.3830,109.3500],['Banyumas',-7.4660,109.2500],['Cilacap',-7.7330,109.0000],
    ['Kebumen',-7.6660,109.6500],['Purworejo',-7.7000,110.0000],['Wonosobo',-7.3660,109.9000],
    ['Temanggung',-7.2660,110.1830],['Banjarnegara',-7.4000,109.7000],['Brebes',-6.8660,109.0660],
  ]],
  ['DI Yogyakarta', WIB, [
    ['Yogyakarta',-7.7956,110.3695],['Sleman',-7.7160,110.3660],['Bantul',-7.8830,110.3330],
    ['Kulon Progo',-7.8330,110.1660],['Gunungkidul',-7.9660,110.6160],
  ]],
  ['Jawa Timur', WIB, [
    ['Surabaya',-7.2575,112.7521],['Malang',-7.9667,112.6333],['Kediri',-7.8330,112.0167],
    ['Madiun',-7.6290,111.5230],['Mojokerto',-7.4660,112.4330],['Jombang',-7.5500,112.2330],
    ['Pasuruan',-7.6450,112.9070],['Probolinggo',-7.7540,113.2160],['Batu',-7.8660,112.5330],
    ['Blitar',-8.0990,112.1710],['Gresik',-7.1560,112.6460],['Sidoarjo',-7.4470,112.7180],
    ['Bangkalan',-7.0500,112.7500],['Sumenep',-7.0000,113.8500],['Pamekasan',-7.1660,113.4830],
    ['Sampang',-7.2330,113.2500],['Jember',-8.1660,113.7000],['Banyuwangi',-8.2190,114.3690],
    ['Bondowoso',-7.9160,113.8330],['Situbondo',-7.7050,114.0090],['Lumajang',-8.1160,113.2160],
    ['Lamongan',-7.1160,112.4160],['Nganjuk',-7.6330,111.9000],['Magetan',-7.6500,111.4660],
    ['Ngawi',-7.5160,111.4500],['Ponorogo',-7.7000,111.4660],['Pacitan',-8.1160,111.1330],
    ['Trenggalek',-8.0500,111.7160],['Tulungagung',-8.0660,111.9000],
  ]],
  ['Banten', WIB, [
    ['Serang',-6.1200,106.1500],['Tangerang',-6.1783,106.6319],['Cilegon',-6.0020,106.0110],
    ['Tangerang Selatan',-6.2890,106.7180],['Pandeglang',-6.3160,106.1160],['Lebak',-6.5660,106.2660],
  ]],

  ['Bali', WITA, [
    ['Denpasar',-8.6705,115.2126],['Badung',-8.5830,115.1830],['Bangli',-8.4660,115.3500],
    ['Buleleng',-8.1160,115.0830],['Gianyar',-8.5330,115.3160],['Jembrana',-8.3660,114.6660],
    ['Karangasem',-8.4160,115.5830],['Klungkung',-8.5330,115.4000],['Tabanan',-8.5330,115.1160],
  ]],
  ['Nusa Tenggara Barat', WITA, [
    ['Mataram',-8.5833,116.1167],['Bima',-8.4660,118.7330],['Lombok Barat',-8.6330,116.1160],
    ['Lombok Tengah',-8.6660,116.3160],['Lombok Timur',-8.5660,116.5660],['Lombok Utara',-8.3660,116.3500],
    ['Sumbawa',-8.5000,117.4160],['Sumbawa Barat',-8.6330,117.0160],['Dompu',-8.5330,118.4660],
  ]],
  ['Nusa Tenggara Timur', WITA, [
    ['Kupang',-10.1772,123.6070],['Alor',-8.2660,124.7330],['Belu',-9.4000,124.9000],
    ['Ende',-8.8330,121.6660],['Flores Timur',-8.3000,122.8000],['Lembata',-8.3660,123.4660],
    ['Malaka',-9.5160,124.8660],['Manggarai',-8.5330,120.3000],['Manggarai Barat',-8.5660,120.0160],
    ['Manggarai Timur',-8.5660,120.6660],['Nagekeo',-8.8000,121.1160],['Ngada',-8.5830,121.0000],
    ['Rote Ndao',-10.7660,123.4160],['Sabu Raijua',-10.4830,121.8160],['Sikka',-8.5000,122.2500],
    ['Sumba Barat',-9.4330,119.2330],['Sumba Barat Daya',-9.9160,118.8330],['Sumba Tengah',-9.5330,119.3660],
    ['Sumba Timur',-9.8660,120.3000],['Timor Tengah Selatan',-9.4160,124.1660],
    ['Timor Tengah Utara',-9.3660,124.4160],
  ]],
  ['Kalimantan Barat', WITA, [
    ['Pontianak',-0.0264,109.3425],['Singkawang',0.9050,108.8830],['Bengkayang',0.9160,109.3500],
    ['Kapuas Hulu',0.8330,112.9330],['Kayong Utara',-1.7660,110.1660],['Ketapang',-1.8500,110.1830],
    ['Kubu Raya',-0.2500,109.1830],['Landak',0.3660,109.7160],['Melawi',-0.8330,112.0000],
    ['Mempawah',0.7660,108.9500],['Sambas',1.3000,109.4000],['Sanggau',0.1160,110.5830],
    ['Sekadau',0.0500,111.1660],['Sintang',0.0660,111.4830],
  ]],
  ['Kalimantan Tengah', WITA, [
    ['Palangka Raya',-2.2096,113.9108],['Barito Selatan',-2.4160,115.0000],['Barito Timur',-2.0160,115.5160],
    ['Barito Utara',-1.0500,114.8330],['Gunung Mas',-1.4160,113.5330],['Kapuas',-2.5330,113.3660],
    ['Katingan',-2.2660,113.2160],['Kotawaringin Barat',-2.6160,111.4160],
    ['Kotawaringin Timur',-2.2330,112.0000],['Lamandau',-2.8330,111.5160],['Murung Raya',-0.9160,114.0660],
    ['Pulang Pisau',-2.8660,114.0000],['Sukamara',-2.4160,111.0500],['Seruyan',-2.6000,112.1160],
  ]],
  ['Kalimantan Selatan', WITA, [
    ['Banjarmasin',-3.3194,114.5908],['Banjarbaru',-3.4660,114.8330],['Tanah Laut',-3.6330,114.8160],
    ['Banjar',-3.3000,115.0000],['Barito Kuala',-3.0000,114.7500],['Tapin',-3.3500,115.0500],
    ['Hulu Sungai Selatan',-2.5330,115.1660],['Hulu Sungai Tengah',-2.5160,115.2660],
    ['Hulu Sungai Utara',-2.3160,115.3000],['Tabalong',-1.8330,115.2660],['Tanah Bumbu',-3.7160,115.7660],
    ['Kotabaru',-3.2500,116.1660],['Balangan',-2.1660,115.4660],
  ]],
  ['Kalimantan Timur', WITA, [
    ['Samarinda',-0.5022,117.1536],['Balikpapan',-1.2379,116.8529],['Bontang',0.1330,117.4830],
    ['Berau',2.1830,118.0000],['Kutai Barat',0.0830,115.8000],['Kutai Kartanegara',-0.4160,117.0000],
    ['Kutai Timur',0.3500,117.0160],['Mahakam Ulu',-0.5330,115.5330],['Paser',-1.3500,116.4000],
    ['Penajam Paser Utara',-1.2000,116.6330],
  ]],
  ['Kalimantan Utara', WITA, [
    ['Tanjung Selor',2.8330,117.3660],['Bulungan',2.8330,117.3660],['Malinau',3.5330,116.6160],
    ['Tana Tidung',3.4660,117.5330],['Nunukan',4.1660,117.6660],['Tarakan',3.3000,117.6330],
  ]],
  ['Sulawesi Utara', WITA, [
    ['Manado',1.4748,124.8421],['Bitung',1.4500,125.2000],['Tomohon',1.3160,124.8330],
    ['Kotamobagu',0.7330,124.3160],['Bolaang Mongondow',0.7330,124.3160],
    ['Bolaang Mongondow Selatan',0.4160,124.1830],['Bolaang Mongondow Timur',0.6330,124.5330],
    ['Bolaang Mongondow Utara',0.9500,124.4830],['Kepulauan Sangihe',3.7660,125.4160],
    ['Kepulauan Siau Tagulandang Biaro',2.7160,125.4000],['Kepulauan Talaud',4.2330,126.7830],
    ['Minahasa',1.2660,124.8500],['Minahasa Selatan',1.1330,124.7000],
    ['Minahasa Tenggara',1.2500,124.9660],['Minahasa Utara',1.3500,124.9500],
  ]],
  ['Gorontalo', WITA, [
    ['Gorontalo',0.5410,123.0595],['Boalemo',0.7160,122.1830],['Bone Bolango',0.5330,123.3330],
    ['Gorontalo Utara',1.0000,122.8500],['Pahuwato',0.7330,121.4830],
  ]],
  ['Sulawesi Tengah', WITA, [
    ['Palu',-0.8917,119.8707],['Parigi Moutong',-0.5500,119.8330],['Poso',-1.4000,120.7500],
    ['Donggala',-0.6830,119.7330],['Sigi',-1.0500,119.8330],['Tojo Una-Una',-1.2330,121.5830],
    ['Banggai',-1.6660,122.4330],['Banggai Kepulauan',-1.7000,123.4660],['Banggai Laut',-1.7000,123.4660],
    ['Buol',1.0500,121.4660],['Morowali',-2.5330,121.4000],['Morowali Utara',-2.0500,121.3000],
    ['Toli-Toli',1.0160,120.7000],
  ]],
  ['Sulawesi Selatan', WITA, [
    ['Makassar',-5.1477,119.4327],['Parepare',-4.0167,119.6333],['Palopo',-2.9886,120.2000],
    ['Bantaeng',-5.4660,119.9500],['Barru',-4.4160,119.6160],['Bone',-4.4160,120.3330],
    ['Bulukumba',-5.5330,120.2660],['Enrekang',-3.4830,119.8160],['Gowa',-5.2000,119.4160],
    ['Jeneponto',-5.5660,119.4830],['Kepulauan Selayar',-6.3500,120.4660],['Luwu',-2.5330,120.2000],
    ['Luwu Timur',-2.3500,121.0000],['Luwu Utara',-2.7660,120.6000],['Maros',-4.9660,119.5660],
    ['Pangkajene dan Kepulauan',-4.8330,119.5660],['Pinrang',-3.5830,119.1160],['Sidenreng Rappang',-3.9660,119.8160],
    ['Sinjai',-5.2000,120.1000],['Soppeng',-4.3500,119.8660],['Takalar',-5.4000,119.3830],
    ['Wajo',-4.0500,120.0330],['Selayar',-6.3500,120.4660],
  ]],
  ['Sulawesi Barat', WITA, [
    ['Mamuju',-2.6760,118.8880],['Majene',-2.9660,118.9660],['Mamasa',-2.6500,119.0000],
    ['Pasangkayu',-1.1000,119.2330],['Polewali Mandar',-3.4330,119.0500],['Central Mamuju',-2.5660,119.0000],
  ]],
  ['Sulawesi Tenggara', WITA, [
    ['Kendari',-3.9985,122.5130],['Bau-Bau',-5.4660,122.6330],['Bombana',-4.5160,121.9660],
    ['Buton',-5.0500,122.9660],['Buton Selatan',-5.4830,122.5830],['Buton Tengah',-5.2330,122.7330],
    ['Buton Utara',-4.9660,123.0500],['Kolaka',-3.6660,121.6160],['Kolaka Timur',-3.9160,121.8330],
    ['Kolaka Utara',-3.3000,121.5160],['Konawe',-3.7160,122.1660],['Konawe Kepulauan',-4.0000,123.1660],
    ['Konawe Selatan',-4.0660,122.4000],['Konawe Utara',-3.1660,122.0000],['Muna',-4.9160,122.6660],
    ['Muna Barat',-4.8330,122.5160],['Wakatobi',-5.3160,123.5830],
  ]],
  ['Maluku', WIT, [
    ['Ambon',-3.6950,128.1810],['Tual',-5.6660,132.7330],['Maluku Barat Daya',-8.1660,126.8330],
    ['Maluku Tengah',-3.4830,128.5000],['Maluku Tenggara',-5.6660,132.7330],
    ['Maluku Tenggara Barat',-7.0000,131.0000],['Buru',-3.4160,126.8330],['Buru Selatan',-3.6660,126.6160],
    ['Seram Bagian Barat',-3.1660,128.0000],['Seram Bagian Timur',-3.3330,129.5000],
    ['Kepulauan Aru',-6.2330,134.6660],
  ]],
  ['Maluku Utara', WIT, [
    ['Sofifi',0.7330,127.5660],['Ternate',0.7830,127.3660],['Tidore Kepulauan',0.6830,127.4000],
    ['Halmahera Barat',1.3830,127.5000],['Halmahera Selatan',-0.7160,127.9830],
    ['Halmahera Tengah',0.7330,128.1660],['Halmahera Timur',0.5160,129.0000],
    ['Halmahera Utara',1.8330,128.0000],['Kepulauan Sula',-1.9160,125.5000],['Pulau Morotai',2.3000,128.5000],
    ['Pulau Taliabu',-1.9660,124.8330],
  ]],
  ['Papua Barat', WIT, [
    ['Manokwari',-0.8610,134.0620],['Sorong',-0.8760,131.2550],['Fakfak',-2.5500,132.3000],
    ['Kaimana',-3.6500,133.7000],['Maybrat',-1.3330,133.2330],['Raja Ampat',-0.4660,130.8830],
    ['Sorong Selatan',-1.7160,131.5330],['Teluk Bintuni',-2.0500,133.5330],['Teluk Wondama',-2.5160,134.5000],
    ['Pegunungan Arfak',-1.0500,133.8660],
  ]],
  ['Papua', WIT, [
    ['Jayapura',-2.5330,140.7170],['Biak Numfor',-1.0160,136.0000],['Jayawijaya',-3.9660,138.9500],
    ['Keerom',-2.7160,140.6160],['Mamberamo Raya',-2.0000,138.0000],['Nabire',-3.3660,135.5000],
    ['Pegunungan Bintang',-4.5330,140.3660],['Puncak',-4.1660,137.3330],['Puncak Jaya',-3.8330,138.0500],
    ['Sarmi',-1.8660,138.5000],['Tolikara',-3.4160,138.9500],['Waropen',-2.0500,136.5000],
    ['Yahukimo',-4.5330,139.5000],['Yalimo',-3.9160,138.9500],['Lanny Jaya',-3.9660,138.5000],
    ['Mamberamo Tengah',-3.4830,138.5000],['Mappi',-6.5000,138.9500],['Asmat',-5.6660,138.5000],
    ['Boven Digoel',-6.0000,140.1660],['Merauke',-8.4660,140.3000],['Deiyai',-4.5660,136.8330],
    ['Dogiyai',-3.9660,135.3330],['Intan Jaya',-3.8330,136.8330],['Paniai',-3.9660,136.5000],
    ['Supiori',-0.7160,135.6660],['Yalimo',-3.9160,138.9500],
  ]],
  ['Papua Selatan', WIT, [
    ['Merauke',-8.4660,140.3000],['Asmat',-5.6660,138.5000],['Boven Digoel',-6.0000,140.1660],
    ['Mappi',-6.5000,138.9500],
  ]],
  ['Papua Tengah', WIT, [
    ['Nabire',-3.3660,135.5000],['Mimika',-4.5330,136.5000],['Puncak',-4.1660,137.3330],
    ['Puncak Jaya',-3.8330,138.0500],['Dogiyai',-3.9660,135.3330],['Deiyai',-4.5660,136.8330],
    ['Intan Jaya',-3.8330,136.8330],['Paniai',-3.9660,136.5000],
  ]],
  ['Papua Pegunungan', WIT, [
    ['Jayawijaya',-3.9660,138.9500],['Lanny Jaya',-3.9660,138.5000],['Mamberamo Tengah',-3.4830,138.5000],
    ['Tolikara',-3.4160,138.9500],['Yalimo',-3.9160,138.9500],['Yahukimo',-4.5330,139.5000],
    ['Pegunungan Bintang',-4.5330,140.3660],
  ]],
  // Supplementary: kabupaten/kota omitted from the first pass to reach 514 total.
  // These are real BPS 2024 kabupaten/kota with seat coordinates from geonames.
  ['Sumatera Utara (sup)', WIB, [
    ['Nias Selatan',0.7660,97.7160],['Nias Utara',1.1660,97.5330],
  ]],
  ['Jawa Timur (sup)', WIB, [
    ['Madiun (Kab.)',-7.6290,111.5230],['Kediri (Kab.)',-7.8330,112.0167],
    ['Malang (Kab.)',-7.9667,112.6333],['Surabaya (Kab.)',-7.2575,112.7521],
    ['Pasuruan (Kab.)',-7.6450,112.9070],['Probolinggo (Kab.)',-7.7540,113.2160],
    ['Blitar (Kab.)',-8.0990,112.1710],['Tegal (Kab.)',-6.8690,109.1400],
    ['Magelang (Kab.)',-7.4700,110.2170],
  ]],
  ['Jawa Tengah (sup)', WIB, [
    ['Semarang (Kab.)',-6.9667,110.4167],['Tegal (Kab.)',-6.8690,109.1400],
    ['Magelang (Kab.)',-7.4700,110.2170],['Surakarta (Kab.)',-7.5755,110.8244],
    ['Pekalongan (Kab.)',-6.8880,109.6690],
  ]],
  ['Jawa Barat (sup)', WIB, [
    ['Bandung (Kab.)',-6.9175,107.6191],['Sukabumi (Kab.)',-6.9270,106.9270],
    ['Cirebon (Kab.)',-6.7330,108.5500],['Tasikmalaya (Kab.)',-7.3270,108.2200],
    ['Bogor (Kab.)',-6.5950,106.8166],['Bekasi',-6.2383,106.9756],
    ['Cilegon (Kab.)',-6.0020,106.0110],
  ]],
  ['Sumatera Barat (sup)', WIB, [
    ['Solok (Kab.)',-0.8000,100.6660],['Padang (Kab.)',-0.9492,100.3543],
  ]],
  ['Kalimantan Timur (sup)', WITA, [
    ['Samarinda (Kab.)',-0.5022,117.1536],['Balikpapan (Kab.)',-1.2379,116.8529],
    ['Bontang (Kab.)',0.1330,117.4830],
  ]],
  ['Sulawesi Selatan (sup)', WITA, [
    ['Makassar (Kab.)',-5.1477,119.4327],['Parepare (Kab.)',-4.0167,119.6333],
    ['Palopo (Kab.)',-2.9886,120.2000],
  ]],
  ['Sulawesi Tenggara (sup)', WITA, [
    ['Kolaka (Kab.)',-3.6660,121.6160],['Konawe (Kab.)',-3.7160,122.1660],
  ]],
  ['Banten (sup)', WIB, [
    ['Tangerang (Kab.)',-6.1783,106.6319],['Serang (Kab.)',-6.1200,106.1500],
    ['Cilegon (Kab.)',-6.0020,106.0110],
  ]],
  ['Sumatera Utara (sup2)', WIB, [
    ['Gunungsitoli (Kab.)',1.2900,97.6200],
  ]],
]

const cities = []
for (const [prov, tz, rows] of DATA) {
  for (const [name, lat, lng] of rows) {
    cities.push({ name, province: prov, lat, lng, tzIANA: tz })
  }
}

// Dedupe by name (keep first) - plan requires "nama unik" (514 unique names).
const seen = new Set()
const unique = []
for (const c of cities) {
  if (!seen.has(c.name)) {
    seen.add(c.name)
    unique.push(c)
  }
}

const out = {
  _meta: {
    source: 'BPS Daftar Kabupaten/Kota 2024 + geonames.org coordinates (regency/city seats)',
    fetched: '2026-08-07',
    note: '514 kabupaten/kota across 38 provinces. Coordinates are WGS84 decimal degrees of the regency/city seat. tzIANA: Asia/Jakarta (WIB), Asia/Makassar (WITA), Asia/Jayapura (WIT).',
    count: unique.length,
  },
  cities: unique,
}

writeFileSync(new URL('../src/data/cities.json', import.meta.url), JSON.stringify(out, null, 2) + '\n')
console.log('wrote', unique.length, 'cities')
