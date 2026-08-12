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
| Frontend | Satu file `index.html` vanilla (desain **iOS modern**). Tanpa framework/build. `classic.html` = versi lama **Windows 98** (fallback, + tag git `win98`). |
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
- `keg_config` — PIN + faktor skor. View `keg_config_public` = config tanpa PIN.

Anon **hanya SELECT**; grant INSERT/UPDATE/DELETE sudah dicabut. Semua tulis lewat fungsi
`security definer` yang minta PIN: `keg_cek_pin`, `keg_simpan_jenis`, `keg_hapus_jenis`,
`keg_simpan_kegiatan`, `keg_hapus_kegiatan`, `keg_simpan_anggota`, `keg_hapus_anggota`,
`keg_set_config`.

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
pulang dianggap perjalanan, bukan kerja). **Hanya di `index.html` (iOS); `classic.html` masih
pakai `jumlah_hari` penuh.** Skor jalan tidak terpengaruh — uang tetap dihitung penuh.

Aturan yang gampang terlanggar saat menambah fitur:

1. **`jumlah_hari` adalah kolom sendiri, bukan selisih tanggal** — supaya catatan tanpa
   tanggal tetap punya bobot.
2. **Catatan tanpa tanggal selalu ikut dihitung di periode manapun** — sengaja, supaya tidak
   hilang dari rekap sebelum tanggalnya diisi.
3. **Semua angka yang tampil wajib lewat `bulat()`** — float JS menghasilkan
   `10.799999999999999`. Kalau menambah tampilan angka baru, jangan lupa.
4. `rekap(fj)`: `undefined` = ikut `PERIODE.jenis`, `0` = paksa semua jenis (dipakai form
   catat untuk angka total), angka lain = jenis tertentu.
5. Flag "jarang jalan, beban tinggi" **dimatikan saat filter jenis aktif** — rata-rata dalam
   satu jenis kegiatan tidak mewakili pemerataan rezeki.

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

**Default sekarang desain iOS modern** (`index.html`): kartu rounded, font sistem, aksen biru
iOS `#007aff`, dark mode auto (`prefers-color-scheme`), tab bar di bawah, modal bottom-sheet.
Semua warna lewat CSS variable di `:root`.

Versi retro **Windows 98** dipertahankan sebagai `classic.html` (+ tag git `win98`) sebagai
fallback — panduan retro ini berlaku untuk file itu, BUKAN `index.html`: bevel border, abu
`#c0c0c0`, title bar navy, font MS Sans Serif, dark mode "High Contrast Black".

Dua-duanya skin di atas layout mobile-first, bukan simulasi desktop. Jangan bikin window yang
bisa digeser atau taskbar — dia buka ini dari HP.

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
