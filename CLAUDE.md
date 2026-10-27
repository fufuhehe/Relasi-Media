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

---

## Skema data

- `keg_anggota` — nama, kategori (`tim`/`tu`), aktif
- `keg_jenis` — master daftar kegiatan: nama, tier, tingkat_beban. **Bobot nempel di sini.**
- `keg_kegiatan` — satu baris = sekali jalan. jenis_id, judul, tanggal (nullable),
  jumlah_hari, lokasi, tier, tingkat_beban, ketua_id, catatan
- `keg_penugasan` — kegiatan_id + anggota_id saja (tidak ada kolom peran)
- `keg_foto` — bukti dokumentasi: kegiatan_id, path (unik), keterangan, dibuat
- `keg_dokumen` — link dokumen & folder Drive: kegiatan_id, url, nama, dibuat. **ADMIN ONLY**
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

Menampilkan foto: bucket privat, jadi perlu signed URL —
POST `/storage/v1/object/sign/bukti/{path}` body `{"expiresIn":3600}`. Balasannya
`signedURL` berupa path RELATIF; URL lengkap = `SB_URL + "/storage/v1" + signedURL`.
Hasilnya di-cache di `FOTO_URL`.

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

Skor jalan (proxy uang, sama untuk semua peserta):

| Tier | Rumus |
|---|---|
| `dalam_kota` | `poin_dalam_kota × jumlah_hari` (default 1/hari) |
| `luar_pp` | `poin_luar_pp × jumlah_hari` (default 2.5/hari) |
| `luar_inap` | `poin_luar_inap + poin_per_malam × (jumlah_hari − 1)` (default 3 + 2/malam) |

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
