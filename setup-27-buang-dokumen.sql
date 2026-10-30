-- =========================================================
-- Buang fitur link dokumen & folder Drive
--
-- Alasan: semangat app ini rekap perjalanan dinas, bukan administrasi
-- persuratan. Fitur ini juga yang dulu memicu pengetatan keamanan.
--
-- CATATAN PENTING: tabelnya TIDAK di-DROP, cuma DIGANTI NAMA jadi
-- keg_dokumen_arsip. Linknya tetap utuh dan bisa dibaca kapan pun.
-- App sudah tidak melihatnya sama sekali. Kalau nanti kamu sudah yakin
-- tidak butuh, hapus sendiri dengan:
--     drop table keg_dokumen_arsip;
--
-- Aman diulang.
-- =========================================================

-- ---------- 1. Fungsi-fungsinya dicabut ----------
drop function if exists keg_daftar_dokumen(text);
drop function if exists keg_simpan_dokumen(text, bigint, bigint, text, text);
drop function if exists keg_hapus_dokumen(text, bigint);

-- ---------- 2. Tabel diarsipkan, bukan dibuang ----------
do $$
begin
  if exists (select 1 from information_schema.tables
              where table_schema='public' and table_name='keg_dokumen') then
    execute 'alter table keg_dokumen rename to keg_dokumen_arsip';
  end if;
end $$;

-- Tetap tertutup rapat: anon tidak boleh menyentuh arsipnya.
do $$
begin
  if exists (select 1 from information_schema.tables
              where table_schema='public' and table_name='keg_dokumen_arsip') then
    execute 'alter table keg_dokumen_arsip enable row level security';
    execute 'revoke all on keg_dokumen_arsip from anon, authenticated';
  end if;
end $$;

-- ---------- 3. Lihat isi arsipnya ----------
-- Kalau mau simpan linknya di tempat lain, salin dari hasil di bawah.
select a.id, k.tanggal, k.judul, a.nama, a.url
  from keg_dokumen_arsip a
  left join keg_kegiatan k on k.id = a.kegiatan_id
 order by k.tanggal desc nulls last, a.id;
