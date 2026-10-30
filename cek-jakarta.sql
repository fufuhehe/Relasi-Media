-- =========================================================
-- Cuma MEMBACA. Tidak mengubah apa pun.
-- Buat menjawab: ada berapa catatan yang tujuannya DKI Jakarta,
-- dan mana yang sebelumnya kena hitungan transport ngawur.
-- =========================================================

-- 1) Ringkasan: berapa catatan per provinsi + tier
select coalesce(k.provinsi,'(kosong)')          as provinsi,
       k.tier,
       count(*)                                  as catatan,
       count(k.kota)                             as punya_tujuan_khusus
  from keg_kegiatan k
 group by 1,2
 order by 3 desc;

-- 2) Yang kena bug: provinsi DKI tapi tier-nya bukan dalam_kota
--    dan tidak punya tujuan khusus. Sebelum perbaikan, catatan ini
--    dihitung (250rb + 250rb) x 2 = Rp 1.000.000. Sekarang 170rb.
select k.id, k.tanggal, j.nama as jenis, k.judul, k.lokasi,
       k.tier, k.jumlah_hari, k.hari_meeting
  from keg_kegiatan k
  left join keg_jenis j on j.id = k.jenis_id
 where coalesce(k.provinsi,'') = 'DKI Jakarta'
   and k.tier <> 'dalam_kota'
   and k.kota is null
 order by k.tanggal desc nulls last;

-- 3) Hitung cepatnya saja
select count(*) as catatan_dki_yang_tadinya_salah
  from keg_kegiatan
 where coalesce(provinsi,'') = 'DKI Jakarta'
   and tier <> 'dalam_kota'
   and kota is null;
