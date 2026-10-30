# CLAUDE.md — Relasi-Media / Catatan Kegiatan Tim

File ini dibaca otomatis tiap sesi. Isinya konteks yang tidak boleh ditanyakan ulang.

---

## Cara bicara dengan pemilik repo

- Panggil **"bro"**. Bahasa gaul Indonesia (gw/lo), santai tapi teknis.
- Non-programmer tapi paham konsep IT. Nyaman: copy-paste kode, GitHub, SQL Editor Supabase,
  dashboard hosting. **Tidak** nyaman: setup toolchain lokal yang ribet.
- Prinsip: **gratis atau semurah mungkin**, minim maintenance, tidak mau jadi "admin manual".
  Kalau ada biaya bulanan, sebutkan angkanya di depan sebelum eksekusi.
- Jawab to the point tapi lengkap. Kasih opsi + rekomendasi jujur.
  **Berani pushback** kalau idenya kurang bagus, jelaskan alasannya.
- Kalau tidak yakin atau tidak bisa verifikasi, **bilang jujur** dan kasih cara dia cek sendiri.

---

## Apa ini

PWA "buku catatan digital" untuk tim kerja kantor: mencatat siapa jalan ke mana, lalu memantau
**pemerataan** — siapa sering jalan (proxy rezeki) vs siapa kebagian beban berat.
Live di `https://fufuhehe.github.io/Relasi-Media/`. Dipakai satu orang (dia) sebagai pencatat;
anggota tim cuma melihat.

**Foto bukti bersifat OPSIONAL, bukan wajib.** Sebagian besar catatan dibuat dengan cara
backfill (fotonya belum tentu ada saat mencatat), jadi mewajibkan foto akan mematikan alur
catat-cepat. Yang belum ada fotonya cukup diberi penanda, pola sama dengan "belum
bertanggal". Pemilih file memakai galeri (TANPA atribut `capture`) dan boleh pilih beberapa
foto sekaligus.

**Filosofi desain — ini yang paling penting:** sesederhana nyatat di kertas.
Mencatat = pilih kegiatan dari dropdown, centang nama, simpan. Selesai.
Tanggal, lokasi, ketua, catatan semuanya opsional.

Versi pertama sempat punya status kegiatan, tabel cuti, dan dropdown peran per orang.
Semua dibuang karena bikin ribet. **Patokan sebelum menambah field apa pun:
bandingkan dengan apa yang dia tulis kalau pakai kertas. Kalau di kertas tidak ditulis,
jangan jadi field wajib.**

---

## Stack

| Item | Detail |
|---|---|
| Frontend | `index.html` = desain **Windows 98** (default). `ios.html` = varian **iOS modern**. Dua-duanya vanilla, tanpa framework/build, **logika identik**. Bisa dipilih dari panel admin. Tag git `win98` menandai versi retro awal. |
| Hosting | GitHub Pages dari branch `main`, root. Semua path relatif `./` |
| Backend | Supabase project `wwgqgsjyaodxfuhjwksj` (numpang project ODOP), prefix tabel `keg_` |
| Biaya | Rp 0/bulan |

Anon key ditanam di frontend — memang untuk publik, itu bukan kebocoran.
Keamanan datang dari RLS + pencabutan grant, bukan dari menyembunyikan key.

**App dikunci sandi tim.** Semua baca lewat `keg_data(p_sandi)`; tidak ada tabel `keg_*`
yang bisa dibaca anon langsung. Lihat bagian "Sandi tim" di bawah.

---

## Skema data

- `keg_anggota` — nama, kategori (`tim`/`tu`), aktif
- `keg_jenis` — master daftar kegiatan: nama, tier, tingkat_beban. **Bobot nempel di sini.**
- `keg_kegiatan` — satu baris = sekali jalan. jenis_id, judul, tanggal (nullable),
  jumlah_hari, lokasi, tier, tingkat_beban, ketua_id, catatan, provinsi, hari_meeting,
  `kota` (tujuan terpilih, nullable)
- `keg_penugasan` — kegiatan_id + anggota_id saja (tidak ada kolom peran)
- `keg_foto` — bukti dokumentasi: kegiatan_id, path (unik), keterangan, dibuat, `sampul` bool
- `keg_dokumen` — link dokumen & folder Drive: kegiatan_id, url, nama, dibuat. **ADMIN ONLY**
- `keg_transport_kota` — daftar tujuan: kota, provinsi, tarif PP (0 = at-cost), urutan. ADMIN ONLY
- `keg_config` — PIN + faktor skor. View `keg_config_public` = config tanpa PIN.

Anon **hanya SELECT**; grant INSERT/UPDATE/DELETE sudah dicabut. Semua tulis lewat fungsi
`security definer` yang minta PIN: `keg_cek_pin`, `keg_simpan_jenis`, `keg_hapus_jenis`,
`keg_simpan_kegiatan`, `keg_hapus_kegiatan`, `keg_simpan_anggota`, `keg_hapus_anggota`,
`keg_set_config`, `keg_simpan_foto`, `keg_hapus_foto` (mengembalikan path supaya app bisa
menghapus filenya juga).

### Bukti foto — alur upload
File foto TIDAK bisa diunggah lewat fungsi Postgres, jadi ada Edge Function
**`bukti-upload`** (Verify JWT dimatikan) yang memeriksa PIN di sisi server lalu
mengembalikan signed upload URL. Bucket **`bukti`** privat, batas 2 MB/file.
Urutan di app: minta izin ke Edge Function → PUT file ke signed URL → catat lewat
`keg_simpan_foto`.

Foto bisa masuk lewat tiga jalan, semuanya bermuara ke `unggahBanyak()`: pilih file,
**tempel dari clipboard (Ctrl+V)**, dan **seret-lepas**. Dua jalan terakhir menyasar kegiatan
yang modalnya sedang terbuka, dilacak lewat `MODAL_KEG` — yang WAJIB direset di `bukaModal()`,
`tutupModal()` dan `bukaForm()`, kalau tidak foto bisa nyasar ke kegiatan yang salah.
Listener dipasang sekali oleh `pasangTempel()` saat app mulai. Petunjuk "Ctrl+V / seret"
hanya tampil di perangkat bermouse (`adaMouse()`, pakai `window.matchMedia` — jangan panggil
`matchMedia` telanjang).

**JANGAN kirim header `apikey`/`Authorization` pada PUT ke signed URL.** Header auth ganda
menghasilkan `403 Invalid Compact JWS` — bug yang sama pernah mematikan unggahan di proyek
Notulen (v51). Ada tes khusus untuk ini.

### Penampil foto & sampul
Ketuk foto di layar detail membuka penampil layar penuh (`LB`, elemen `#lb` yang dibuat
sekali lalu diisi ulang `gambarLB()`): geser kiri-kanan di layar sentuh (ambang 45px), tombol
panah di layar lebar, penanda urutan, dan tombol **Jadikan sampul** untuk admin. Satu-satunya
tempat memilih sampul — sengaja tidak ada tombol per thumbnail di grid supaya grid tetap
bersih.

`fotoSampul(kegId)` memilih foto bertanda `sampul`, kalau tidak ada jatuh ke foto pertama.
Hanya satu sampul per kegiatan, dijaga di `keg_set_sampul(p_pin,p_id)` yang mengosongkan
yang lain dulu. **App tetap jalan kalau kolom `sampul` belum ada** (jatuh ke foto pertama);
ada tes untuk keadaan itu — jaga sifat ini kalau menambah kolom lain.

Menampilkan foto: bucket privat, jadi perlu signed URL —
POST `/storage/v1/object/sign/bukti/{path}` body `{"expiresIn":3600}`. Balasannya
`signedURL` berupa path RELATIF; URL lengkap = `SB_URL + "/storage/v1" + signedURL`.
Hasilnya di-cache di `FOTO_URL`.

### Sandi tim — kunci seluruh app
Dua rahasia di `keg_config`: `sandi` (boleh melihat) dan `pin` (admin). `keg__boleh_lihat(p)`
menerima keduanya, jadi admin cukup memakai PIN di layar gerbang — tidak perlu hafal dua.

**Kenapa harus dikunci di database, bukan cuma layar login:** anon key ada di `index.html`
yang repo-nya publik. Layar password yang hanya menyembunyikan tampilan bisa dilewati dengan
menembak REST API langsung. Karena itu `21-sandi.sql` MENCABUT grant select anon dari semua
tabel `keg_*` dan menghapus policy `keg_bukti_read` di storage. Satu-satunya pintu baca adalah
`keg_data(p_sandi)` yang mengembalikan semuanya sekaligus sebagai jsonb (sekalian menghemat
6 request jadi 1).

Pemicunya: folder Drive yang dilink semuanya "anyone with link", jadi bocornya URL = bocornya
dokumen. Foto kegiatan juga sudah menaikkan taraf kepekaan dari asumsi awal "cuma jadwal dan
nama orang".

**Penandatanganan URL foto pindah ke Edge Function** (`aksi:"sign"`, dijaga sandi), karena
anon tidak lagi boleh membaca `storage.objects`. Jangan mengembalikan policy itu.

`keg_config_public` TIDAK BOLEH memuat `pin` maupun `sandi` — kalau menambah rahasia baru di
`keg_config`, masukkan juga ke daftar pengecualian view itu.

**Frontend sengaja bisa jalan di dua dunia**: `muat()` mencoba `keg_data()` dulu; kalau
fungsinya belum ada ia jatuh ke 6 panggilan REST lama (`muatLama()`), dan kalau sandinya salah
ia memunculkan gerbang. Begitu juga penandatanganan foto: `BARU` menentukan lewat Edge Function
atau langsung, dengan jalur langsung jatuh ke Edge Function kalau ditolak. Ini yang membuat
urutan deploy tidak bisa salah. Ada tes untuk ketiga keadaan — jangan sederhanakan tanpa
menjalankannya.

### Link dokumen & folder Drive — admin only
`keg_dokumen` TIDAK boleh dibaca anon: RLS aktif tanpa policy select dan semua grant dicabut,
jadi tabel ini tidak ada di REST. Dibaca HANYA lewat `keg_daftar_dokumen(p_pin)`; ditulis lewat
`keg_simpan_dokumen` / `keg_hapus_dokumen`.

**Alasannya penting:** app tidak punya login, jadi apa pun yang kebaca anon = kebaca publik.
Isi dokumen memang dijaga Google Drive, tapi JUDUL surat dinas pun metadata sensitif. Jangan
pernah memindahkan link ini jadi kolom di `keg_kegiatan` — tabel itu kebaca anon.

Di app: `DOKUMEN` dimuat oleh `muatDokumen()` saat login/`muat()` dan dikosongkan saat logout.
**JANGAN `return muatDokumen()` di tengah `muat()`** — itu melewati `stat()` dan `render()`
sehingga app nyangkut di "Memuat…" bagi siapa pun yang PIN-nya tersimpan. Rantai dengan
`.then()` supaya render selalu jalan. Ada tes khusus (`muat()` wajib memanggil render di mode
lihat, mode admin, dan saat fungsi dokumen error).
`dokHTML()` mengembalikan string kosong kalau `PIN` null. Penanda "link" di daftar juga hanya
muncul saat admin. URL divalidasi dua lapis: `^https://` di fungsi SQL saat simpan, dan
`urlAman()` di frontend saat render — yang bukan https ditampilkan sebagai teks, bukan `<a>`,
supaya `javascript:` tidak pernah jadi href.

Keputusan: pakai tempel-link, BUKAN Google Picker. Picker butuh setup Cloud Console (OAuth
client, origin, scope `drive.file`) dan token yang mati tiap jam — ditunda sampai tempel-link
terbukti kurang. Izin akses dokumen tetap diurus Drive, bukan app ini.

**Daftar kegiatan menampilkan thumbnail foto pertama**, jadi tanda tangannya WAJIB dibatch —
POST `/storage/v1/object/sign/bukti` (tanpa path) body `{"expiresIn":3600,"paths":[…]}` lewat
`urlFotoBanyak()`, dipecah per 100 path. Satu request untuk seluruh daftar. Jangan kembali ke
tanda tangan satu per satu di dalam perulangan daftar: dengan ratusan catatan itu berarti
ratusan request sekali buka.

Daftar dikelompokkan per bulan sebagai `<details>` yang bisa dilipat. Bulan terbaru terbuka
secara bawaan; status buka/tutup disimpan di `BULAN_BUKA` (memori, bukan localStorage) supaya
tidak hilang saat render ulang — listener dipasang oleh `pasangBulan()` tiap render.

Panel admin juga dilipat per bagian lewat helper `adm(kunci,judul,isi,jml)`, dengan status di
`ADMIN_BUKA` dan listener di `pasangBulan()` yang sama (dia menangani `data-bln` dan
`data-adm`). Semua bagian tertutup secara bawaan, jumlah isinya ditulis di judul. Kalau
menambah bagian admin baru, pakai `adm()` — jangan kembali menulis `<fieldset>`/`<div
class="sect">` telanjang, nanti satu bagian tidak ikut terlipat.

---

## Logika inti — jangan diubah tanpa diminta

**Dua skor terpisah, sengaja tidak digabung.** Menggabungkannya menghapus justru masalah
yang mau dilihat: orang yang sering dinas berat di Jakarta (capek, duit kecil).

**Yang diterima** — uang harian + transport, dalam RUPIAH, mengikuti SBM Kemenkeu
(PMK 32/2025, TA 2026). Sama untuk semua peserta satu kegiatan.

```
hari          = jumlah_hari
hari_meeting  = berapa hari yang paket meeting (dibatasi <= jumlah_hari)
hari_biasa    = hari - hari_meeting
luar          = tier != 'dalam_kota'
nginap        = tier == 'luar_inap'

uang harian = hari_biasa x (luar ? uang_harian_luar[prov] : uang_harian_dalam[prov])
              hari_meeting dapat NOL

transport = tujuan terpilih ? tarif tujuan : (dalam kota ? transport_dalam : rumus provinsi)
            SEKALI per perjalanan, tidak dikali hari
```

**Hanya yang masuk kantong.** Hotel dan tiket TIDAK dihitung — itu diganti sesuai kuitansi,
tidak ada yang untung dari situ. Memasukkannya akan membuat orang yang kebetulan dinas ke
Papua terlihat "kaya" padahal cuma tiketnya mahal.

**Aturan yang gampang keliru:**
Tarif ada di tabel `keg_sbm` (38 provinsi, admin-only, ikut dikirim `keg_data`). Uang harian
sudah terisi dari SBM. Yang belum terisi ditandai di form dan di panel admin, bukan diam-diam
dihitung nol.

### Transport — TIGA jalur, diurut begini
Dasar bukti: **Daftar Nominatif SPD 2026 Ibot** (57 catatan, Rp 41.563.760) dan
**PMK 32/2025 hal. 68** untuk tabel Bodetabek. Itu dokumen resmi, bukan ingatan.
**Jangan menambah komponen yang tidak ada angkanya di dokumen.**

```
1. keg_kegiatan.kota ada di daftar tujuan  → pakai tarifnya (boleh 0)
2. tier == 'dalam_kota'                    → transport_dalam, Jakarta 170rb
3. sisanya                                 → (taksi asal + taksi tujuan) x 2
```

**Transport dibayar SEKALI per perjalanan**, tidak pernah dikali jumlah hari.
Bukti: Kab. Bekasi 2 hari 512rb, Bali 3 hari 938rb, NTT 3 hari 710rb.

**1. Daftar tujuan — `keg_transport_kota`, DIPILIH bukan ditebak.**
Ini pernah salah besar: versi pertama mencocokkan nama kota dengan membaca kolom
`lokasi`. Catatan asli isinya nama venue — "Aston Bintaro" — jadi tidak pernah
kebaca sebagai Tangerang Selatan, jatuh ke jalur 3, dan keluar **Rp 1,47jt padahal
SPJ-nya Rp 516rb**. Semua tes lulus karena fixture-nya gw karang sendiri dengan
lokasi yang kebetulan memuat nama kota. **Pelajaran: kalau logika bergantung pada
isi kolom bebas, ujilah dengan isi kolom yang sebenarnya, bukan karangan.**

Sekarang tujuan dipilih dari satu dropdown (`opsiTujuan`, nilainya `k:<kota>` atau
`p:<provinsi>`) dan disimpan di `keg_kegiatan.kota`. Tidak ada pencocokan teks lagi
di frontend; satu-satunya tebakan teks adalah backfill sekali jalan di
`25-tujuan.sql`, yang hasilnya dicetak untuk ditinjau.

Tarif Bodetabek = angka *one way* PMK hal. 68 **dikali 2** (diklaim Pergi/Pulang),
dan cocok persis dengan SPJ:

| tujuan | one way | PP | SPJ |
|---|---|---|---|
| Kota/Kab. Bekasi | 256.000 | 512.000 | ✓ |
| Kota/Kab. Bogor | 270.000 | 540.000 | ✓ |
| Kota Depok | 248.000 | 496.000 | ✓ |
| Kota Tangerang & Tangsel | 258.000 | 516.000 | ✓ |
| Kab. Tangerang | 279.000 | 558.000 | — |
| Kepulauan Seribu | 386.000 | 772.000 | — |

**Tarif 0 = AT-COST**, bukan "belum diisi": bensin, tol, atau tiket diganti sesuai
kuitansi, jadi tidak ada yang masuk kantong — aturan yang sama dengan hotel dan tiket
pesawat. Karawang, Bandung dan Serang diisi 0. Karawang & Bandung at-cost **apa pun
kendaraannya**, naik kereta pun. Karena 0 punya arti, tujuan yang ketemu di daftar
selalu `lengkap:true` dan tidak ditandai merah.

Provinsi untuk uang harian ikut tujuan terpilih (`provKeg` membaca `kota.provinsi`
dulu), jadi memilih "Kota Depok" otomatis memakai uang harian Jawa Barat.

**2. Dalam kota** — `transport_dalam`, Jakarta 170rb. Ini yang bikin dinas Jakarta
kecil: homebase-nya Jakarta, tidak ada taksi dua ujung.

**3. Luar provinsi** — `(taksi[provinsi_basis] + taksi[prov]) × faktor_transport`.
`keg_sbm.taksi` dari PMK 32/2025 hal. 85, satuan Orang/Kali = sekali jalan.
**`faktor_transport` = 2**, terbukti tiga kali: Bali (250+219)×2 = 938rb,
NTT (250+105)×2 = 710rb, Jatim (250+225)×2 = 950rb.

Catatan lain yang mengikat:
- **`transport_luar` manual lewat Admin MENANG** atas hitungan jalur 3, ditandai `(manual)`.
- Jalur 3 **dihitung live, tidak disimpan**. Jangan "optimasi" jadi kolom tersimpan.
- Tabel taksi cuma **34 provinsi**; empat pemekaran Papua `taksi`-nya 0, ditandai belum lengkap.
- Kolom "Transportasi" di SPJ **kadang berisi tiket pesawat riil** (ada satu 3.373.760).
  Penggantian kuitansi, bukan yang masuk kantong — sengaja TIDAK dimodelkan.
- `rinciJalan` mengembalikan **`asal`**, kalimat pendek dari mana angka transport datang
  ("tarif Kota Depok" / "hitungan provinsi Bali" / "at-cost ke Bandung…"). Ditampilkan di
  form catat DAN layar detail. **Jangan dihapus** — bug 1,47jt di atas lolos justru karena
  angkanya salah diam-diam.

### Uang harian — hari yang ditanggung panitia dapat NOL
Aturan dari Ibot (30 Okt 2026), menggantikan model uang saku fullboard:

```
uang harian = (jumlah_hari - hari_meeting) x tarif provinsi
```

- Hari yang konsumsinya ditanggung panitia → **nol, titik**. Tidak ada lagi 130rb
  untuk yang menginap; `uang_saku_fullboard` sudah dibuang dari panel admin.
- 3 hari dengan meeting di hari kedua → uang harian **2 hari**. Meeting 3 hari → **0**.
- Patokannya **konsumsi ditanggung**, BUKAN kata "meeting". Waktu Ibot jadi narasumber
  di acara instansi lain, makannya ditanggung panitia, jadi hari itu nol juga —
  dibuktikan SPD 10/05/2026 Banten 2 hari yang uang hariannya cuma 370rb (satu hari).
- Karena itu label di UI berbunyi **"Berapa hari yang makannya ditanggung panitia?"**
  dan pilihan di master jenis "Ya, ditanggung panitia (paket meeting / jadi narasumber)".
  **Jangan dikembalikan ke kata "paket meeting" saja** — Ibot akan menjawab "bukan
  meeting" untuk hari narasumber dan uang hariannya jadi dobel. Nama kolom di database
  tetap `hari_meeting` / `paket_meeting` supaya tidak perlu migrasi.

### Dua dunia saat deploy
GitHub Pages terbit duluan, SQL dijalankan belakangan. Karena itu `simpanKegiatan()`
mencoba `keg_simpan_kegiatan` dengan `p_kota`; kalau fungsinya belum kenal parameter itu
ia **mengulang tanpa `p_kota`** supaya mencatat tidak mati total. `DB.kota` juga default
`[]`, dan kegiatan tanpa properti `kota` jatuh ke jalur provinsi. Ada tes (`t16.js`) —
jangan sederhanakan tanpa menjalankannya.

Tes: `t15.js` (aturan lengkap + catatan SPJ asli), `t16.js` (dua dunia), `t14.js`
(hitungan transport & faktor), `t13.js` (lima contoh awal). Jalankan semuanya di
`index.js` DAN `ios.js`.

Diverifikasi terhadap lima contoh nyata dari Ibot (Okt 2026): meeting Jakarta 170rb,
non-meeting Jakarta 380rb, meeting Bogor 540rb, produksi konten Bogor 970rb, dan 3 hari
nginap dengan meeting di hari kedua. Kelimanya cocok persis. **Kalau mengubah rumus, jalankan
`t13.js` — tes itu memeriksa kelima contoh tersebut.**

**SBM ganti tiap tahun.** PMK 54/2026 untuk TA 2027 sudah terbit. Perlu perbarui `keg_sbm`
tiap awal tahun anggaran.

Angka ini PERKIRAAN, bukan SPJ — SBM itu batas tertinggi, realisasi bisa lebih rendah.
Dipakai untuk membandingkan antar orang, bukan laporan keuangan. Label peringatan ada di
layar "cara hitung"; jangan dihapus.

Skor beban: `hari_kerja × tingkat_beban(1–3) × faktor_peran` (ketua 1.2, lainnya 1.0).
`hari_kerja = jumlah_hari`, KECUALI tier `luar_inap` → `max(1, jumlah_hari − 2)` (hari pergi &
pulang dianggap perjalanan, bukan kerja). Berlaku di `index.html` (Win98) DAN `ios.html`. Skor
jalan tidak terpengaruh — uang tetap dihitung penuh.

Aturan yang gampang terlanggar saat menambah fitur:

1. **`jumlah_hari` adalah kolom sendiri, bukan selisih tanggal** — supaya catatan tanpa
   tanggal tetap punya bobot.
2. **Catatan tanpa tanggal selalu ikut dihitung di periode manapun** — sengaja, supaya tidak
   hilang dari rekap sebelum tanggalnya diisi.
3. **Semua angka yang tampil wajib lewat `bulat()`** — float JS menghasilkan
   `10.799999999999999`. Kalau menambah tampilan angka baru, jangan lupa.
4. `rekap(fj)`: `undefined` = ikut `PERIODE.jenis`, `0` = paksa semua jenis (dipakai form
   catat untuk angka total), angka lain = jenis tertentu.
5. Flag "klunting ngepas, beban tinggi" (dulu "jarang jalan…") **dimatikan saat filter jenis
   aktif**, dan cuma nyala kalau `beban > rata-rata×1.1` DAN `jalan < rata-rata×0.9` (margin
   10% biar yang pas di rata-rata tidak ke-trigger). Ingat: skor jalan = proxy rezeki (di UI
   ditulis **"klunting"**), BUKAN frekuensi jalan. Margin & label ini ada di `index.html` dan `ios.html`.

---

## Aturan wajib saat mengubah `index.html`

1. Sebelum find-replace: `grep` bentuk PERSIS teksnya. Emoji dan karakter khusus bisa
   tersimpan literal atau sebagai escape `\uXXXX`.
2. Setelah edit: **ekstrak isi `<script>` lalu `node --check`**. Pernah ada bug string dibuka
   `'` ditutup `"` yang cuma ketahuan lewat ini.
3. Logika penting (tanggal, skor, bentrok) **disimulasikan dulu via Node tanpa DOM** sebelum
   diserahkan. Tes juga kasus batas: lintas bulan, lintas tahun, tanpa tanggal.
4. **Bump `const CACHE` di `sw.js`** tiap rilis (`kegiatan-v3` → `v4`). Kalau lupa,
   user kejebak versi lama.
5. Jangan hardcode warna. Semua lewat CSS variable di `:root` supaya dark mode ikut jalan.

---

## Estetika

Di UI dua varian ini disebut **Jadul** (`index.html`) dan **Modern** (`ios.html`), bukan
nama sistem operasinya.

**Default sekarang balik ke retro Windows 98** (`index.html`): bevel border, abu `#c0c0c0`,
title bar navy, font MS Sans Serif, dark mode "High Contrast Black". Semua warna lewat CSS
variable di `:root`.

Varian **iOS modern** dipertahankan sebagai `ios.html` (fallback): kartu rounded, font sistem,
aksen biru iOS `#007aff`, dark mode auto (`prefers-color-scheme`), tab bar di bawah, modal
bottom-sheet.

Dua-duanya skin di atas layout mobile-first, bukan simulasi desktop. Jangan bikin window yang
bisa digeser atau taskbar — dia buka ini dari HP.

### Kerapatan daftar
Target sekitar 6-7 kartu per layar HP, rapat tapi masih nyaman diketuk. Aturan yang menjaga itu:

- **Slot foto SELALU ada** (46px), terisi thumbnail atau `kthumb kosong` yang transparan
  dengan garis tipis. Gunanya dua: tepi kiri teks jadi rata (tanpa ini daftarnya bergerigi
  dan capek dibaca), dan slot kosong itu SENDIRI yang menandakan belum ada foto.
- Karena itu **tidak ada lagi chip merah "belum ada foto" di daftar** — 84 dari 87 kartu
  punya chip itu, jadi merahnya kehilangan arti dan malah menuhin layar. Keterangannya pindah
  ke atribut `title` slot kosong, hitungannya tetap ada di ringkasan atas.
- Nama dipotong lewat `namaRingkas(k,maks)`: 4 nama (ketua selalu didahulukan dan ditandai
  `*`), sisanya jadi `+N lagi` dengan class `lbh` yang redup. Daftar 12 nama sebelumnya makan
  3 baris. Nama lengkap tetap ada di layar detail.
- **Kartu daftar tidak punya baris chip sama sekali.** Chip "N foto" dibuang karena
  thumbnail sudah menandakan adanya foto; jumlah persisnya ada di layar detail. Chip teks
  "link" diganti ikon rantai (`IKON_LINK`, SVG inline, class `klink`, `float:right` di dalam
  blok teks) di pojok kanan atas kartu, hanya untuk admin. Jangan kembalikan baris chip —
  itu satu baris penuh di setiap kartu untuk informasi yang sudah terwakili.
- Ikon memakai `float:right` dan ditaruh SEBELUM judul, bukan `position:absolute`. Di varian
  Modern ada chevron di kanan yang vertikal di tengah; absolut akan bertabrakan dengannya.
- URL dokumen ditampilkan lewat `ringkasUrl()` dan dikunci satu baris (class `satu`).
  Jangan pernah `word-break:break-all` pada URL — link Drive panjang dan akan membungkus
  dua-tiga baris. `href` tetap memakai URL asli yang utuh.
- **`<fieldset class="grp">` WAJIB punya `min-width:0`.** Fieldset tidak mau menyusut di
  bawah lebar isinya walaupun anaknya sudah `min-width:0` — ini perilaku khusus elemen itu,
  bukan bug flexbox. Tanpa aturan ini, satu baris `white-space:nowrap` (URL dokumen) melebarkan
  fieldset sampai keluar modal dan tombol di kanan terpotong. Pernah kejadian.
- Layar detail varian Modern menaruh tier, beban, dan skor jalan dalam SATU baris ringkas,
  bukan tiga baris `.cell` terpisah — supaya kerapatannya setara varian Jadul.

### Pemilih tampilan
Panel admin punya kontrol **Jadul / Modern**. Itu label di UI; nilai yang disimpan tetap
`"win"` / `"ios"` di `localStorage.keg_tampilan` (per perangkat) supaya tidak perlu migrasi.
Jangan samakan label dengan nilainya. Halaman lalu pindah ke file pasangannya.

Pengalihnya ada di **blok `<script>` tersendiri di dalam `<head>`** supaya jalan sebelum apa pun
digambar (kalau ditaruh di skrip utama, tampilan lama sempat berkedip). Tiap file menyimpan
identitas dirinya di variabel `DIRI` dan hanya pindah kalau pilihannya berbeda. Penjaga putaran:
`sessionStorage.keg_alih` dipasang sebelum pindah dan dihapus setelah app selesai dimuat
(di blok start, dekat `pasangTempel()`), juga dihapus tepat sebelum pindah yang disengaja dari
panel admin. Nilai yang bukan `"win"`/`"ios"` diabaikan. Ada tes khusus untuk putaran
pengalihan — jangan ubah logika ini tanpa menjalankannya.

Karena file-nya dua, `sw.js` HARUS men-cache `./ios.html` juga, kalau tidak varian iOS mati
saat offline.

**Utang teknis yang disadari:** dua file berarti setiap fitur dikerjakan dua kali dan rawan
melenceng. Penggabungan jadi satu file dengan dua skin CSS sudah dibahas dan ditunda karena
markup keduanya berbeda (`.in kart/.jud/.meta` vs `.cell/.tl/.sb/.chev`), jadi penggabungan
berarti menulis ulang seluruh render UI. Angkat lagi kalau mulai sering ada yang kelewat
di salah satu varian.

---

## Backlog

1. Reminder H-1 lewat n8n miliknya (sudah jalan di Sumopod, sudah terbayar)
2. Feed kalender `.ics`
3. Target pemerataan ("idealnya tiap orang X poin/triwulan") + saran otomatis
4. Link surat tugas / catatan hasil kegiatan

**Sudah ditolak, jangan diusulkan lagi:** approval workflow, hitungan anggaran/SPPD, upload
dokumen, status kegiatan, tabel cuti, dropdown peran per orang, kolom "butuh berapa orang".
Semua ditolak dengan alasan sama: nambah kerjaan input tanpa nambah jawaban.

## Batas akses database

Project Supabase `wwgqgsjyaodxfuhjwksj` dipakai bersama oleh DUA aplikasi.
Tabel berprefix `keg_` milik repo ini. Tabel berprefix `odop_` milik aplikasi
lain yang sedang LIVE dipakai 30+ orang.

JANGAN PERNAH menyentuh tabel `odop_*` — baca boleh, ubah/hapus tidak.
Sebelum menjalankan migrasi apa pun, tunjukkan SQL-nya dulu dan tunggu
persetujuan. Jangan pakai DROP tanpa diminta eksplisit.
