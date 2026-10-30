-- =========================================================
-- Isi tarif transportasi terminal/bandara per provinsi
-- Sumber: PMK 32/2025 (SBM TA 2026) bagian 16, hal. 85
-- Satuan aslinya: Orang/Kali (SEKALI JALAN)
--
-- Jalankan SETELAH 22-sbm.sql. Aman diulang.
-- =========================================================

alter table keg_sbm add column if not exists taksi int not null default 0;

-- 34 provinsi sesuai tabel. Empat provinsi pemekaran Papua
-- tidak ada di tabel itu, jadi dibiarkan 0 dan ditandai app.
update keg_sbm set taksi = v.n from (values
 ('Aceh',123000),('Sumatera Utara',278000),('Riau',99000),('Kepulauan Riau',159000),
 ('Jambi',133000),('Sumatera Barat',171000),('Sumatera Selatan',162000),('Lampung',162000),
 ('Bengkulu',106000),('Bangka Belitung',94000),('Banten',300000),('Jawa Barat',180000),
 ('DKI Jakarta',250000),('Jawa Tengah',105000),('DI Yogyakarta',258000),('Jawa Timur',225000),
 ('Bali',219000),('Nusa Tenggara Barat',224000),('Nusa Tenggara Timur',105000),
 ('Kalimantan Barat',165000),('Kalimantan Tengah',130000),('Kalimantan Selatan',174000),
 ('Kalimantan Timur',300000),('Kalimantan Utara',211000),('Sulawesi Utara',134000),
 ('Gorontalo',256000),('Sulawesi Barat',283000),('Sulawesi Selatan',181000),
 ('Sulawesi Tengah',149000),('Sulawesi Tenggara',154000),('Maluku',279000),
 ('Maluku Utara',208000),('Papua',462000),('Papua Barat',228000)
) as v(prov,n) where keg_sbm.provinsi = v.prov;

-- Pengali: berapa "kali" yang diklaim per ujung.
-- 1 = sekali jalan tiap ujung  (Jakarta-Bogor = 430rb)
-- 2 = pergi pulang tiap ujung  (Jakarta-Bogor = 860rb)
insert into keg_config (kunci, nilai) values ('faktor_transport','1')
on conflict (kunci) do nothing;

-- Transport luar kota TIDAK disimpan sebagai angka mati: app menghitungnya
-- dari (taksi Jakarta + taksi tujuan) x faktor_transport, supaya mengubah
-- faktornya langsung berpengaruh tanpa hitung ulang. Angka yang kamu isi
-- manual lewat Admin tetap menang.
update keg_sbm set transport_luar = 0 where transport_luar = 540000 and provinsi = 'Jawa Barat';

-- Lihat hasilnya
select provinsi, taksi,
       uang_harian_luar, transport_luar,
       case when taksi = 0 then 'tarif terminal belum ada' else '' end as catatan
  from keg_sbm order by urutan;
