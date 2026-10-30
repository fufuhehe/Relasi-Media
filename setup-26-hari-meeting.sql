-- =========================================================
-- Rapikan hari paket meeting di catatan yang sudah ada
--
-- Dulu memilih jenis yang ditandai paket meeting mengisi hari_meeting
-- sebanyak SELURUH durasi kegiatan. Akibatnya kegiatan 3 hari jadi nol
-- uang harian, padahal biasanya cuma satu harinya yang paket.
--
-- Skrip ini menyetel hari_meeting = 1 untuk setiap catatan yang jenis
-- kegiatannya ditandai paket meeting.
--
-- YANG TIDAK DISENTUH:
--   - catatan yang jenisnya BUKAN paket meeting (termasuk yang
--     hari_meeting-nya diisi manual, misalnya hari jadi narasumber)
--   - kolom lain apa pun
--
-- Aman diulang. Kalau ada kegiatan yang memang 2-3 hari paket meeting,
-- betulkan satu-satu lewat form setelah ini.
-- =========================================================

-- ---------- Sebelum: lihat dulu apa yang akan berubah ----------
-- (jalankan bagian ini sendiri kalau mau mengintip dulu)
-- select j.nama as jenis, k.judul, k.tanggal, k.jumlah_hari,
--        k.hari_meeting as sekarang, 1 as jadi
--   from keg_kegiatan k join keg_jenis j on j.id = k.jenis_id
--  where j.paket_meeting and k.hari_meeting is distinct from 1
--  order by k.tanggal desc nulls last;

-- ---------- Ubah ----------
update keg_kegiatan k
   set hari_meeting = 1
  from keg_jenis j
 where j.id = k.jenis_id
   and j.paket_meeting
   and k.hari_meeting is distinct from 1;

-- ---------- Sesudah: ringkasan per jenis kegiatan ----------
select j.nama                                   as jenis,
       case when j.paket_meeting then 'paket meeting' else 'bukan' end as jenisnya,
       count(*)                                 as catatan,
       min(k.hari_meeting)                      as hari_meeting_terkecil,
       max(k.hari_meeting)                      as hari_meeting_terbesar,
       sum(case when k.hari_meeting >= k.jumlah_hari then 1 else 0 end)
                                                as semua_hari_ketutup
  from keg_kegiatan k
  join keg_jenis j on j.id = k.jenis_id
 group by j.nama, j.paket_meeting
 order by j.paket_meeting desc, j.nama;
