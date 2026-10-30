-- =========================================================
-- Transport: pakai angka yang pasti, berhenti menebak
--
-- Dasar: Daftar Nominatif SPD 2026 Ibot (57 catatan, 41.563.760)
--   + SBM 2026 "Transportasi dari DKI Jakarta ke Kabupaten/Kota
--     Sekitar" (satuannya ONE WAY, diklaim Pergi/Pulang = 2x)
--
-- Tiga hal yang diubah:
--   1. faktor_transport = 2   (terbukti: Bali 938rb, NTT 710rb, Jatim 950rb)
--   2. Tarif Bodetabek per KOTA, bukan per provinsi (tidak bisa dihitung)
--   3. Transport dibayar SEKALI per perjalanan, bukan dikali jumlah hari
--
-- Jalankan SETELAH 23-taksi.sql. Aman diulang.
-- =========================================================

-- ---------- 0. Jaring pengaman ----------
-- Kalau 23-taksi.sql belum sempat dijalankan, kolomnya dibikin di sini
-- supaya skrip ini tidak gagal. Angkanya tetap dari 23 — jalankan itu juga.
alter table keg_sbm add column if not exists taksi int not null default 0;

-- ---------- 1. Tarif transport per kota ----------
-- Jakarta -> Bodetabek punya tabel SBM sendiri. Angkanya TIDAK bisa
-- diturunkan dari tarif taksi provinsi (Depok 496rb < Jakarta PP 500rb),
-- jadi harus disimpan. Nilai di bawah = PP, disalin dari SPJ 2026.
create table if not exists keg_transport_kota (
  kota  text primary key,
  tarif int  not null default 0
);

insert into keg_transport_kota (kota, tarif) values
  ('bogor',             540000),   -- Kota & Kab. Bogor, 9 catatan
  ('depok',             496000),   -- 7 catatan
  ('bekasi',            512000),   -- 2 catatan
  ('tangerang selatan', 516000),   -- 5 catatan
  -- Tarif 0 = AT-COST. Bensin, tol, atau tiket kereta diganti sesuai
  -- kuitansi, jadi tidak ada yang masuk kantong -- sama perlakuannya
  -- dengan hotel dan tiket pesawat. Bukan "belum diisi".
  ('karawang',               0),   -- at-cost, apa pun kendaraannya
  ('bandung',                0),   -- at-cost, apa pun kendaraannya
  ('serang',                 0)    -- at-cost (SPD 10/05/2026)
on conflict (kota) do nothing;

-- Dikunci sama seperti tabel keg_* lain: anon tidak boleh baca langsung.
alter table keg_transport_kota enable row level security;
revoke all on keg_transport_kota from anon, authenticated;

-- ---------- 2. Tulis lewat PIN ----------
create or replace function keg_set_transport_kota(p_pin text, p_kota text, p_tarif int)
returns void language plpgsql security definer set search_path = public as $$
declare v_kota text;
begin
  perform keg__wajib_pin(p_pin);
  v_kota := lower(btrim(coalesce(p_kota,'')));
  if v_kota = '' then raise exception 'Nama kota kosong'; end if;
  -- Tarif 0 BOLEH dan ada artinya: "at-cost, tidak ada lumpsum yang
  -- masuk kantong" (bensin + tol diganti sesuai kuitansi). Beda dengan
  -- kota yang tidak terdaftar, yang jatuh ke rumus provinsi.
  insert into keg_transport_kota (kota, tarif) values (v_kota, greatest(0, coalesce(p_tarif,0)))
  on conflict (kota) do update set tarif = excluded.tarif;
end $$;
revoke all on function keg_set_transport_kota(text,text,int) from public;
grant execute on function keg_set_transport_kota(text,text,int) to anon;

create or replace function keg_hapus_transport_kota(p_pin text, p_kota text)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform keg__wajib_pin(p_pin);
  delete from keg_transport_kota where kota = lower(btrim(coalesce(p_kota,'')));
end $$;
revoke all on function keg_hapus_transport_kota(text,text) from public;
grant execute on function keg_hapus_transport_kota(text,text) to anon;

-- ---------- 3. keg_data ikut mengirim daftar kota ----------
create or replace function keg_data(p_sandi text)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if not keg__boleh_lihat(p_sandi) then
    raise exception 'Sandi salah';
  end if;
  return jsonb_build_object(
    'anggota', (select coalesce(jsonb_agg(to_jsonb(a) order by a.kategori, a.urutan, a.nama), '[]'::jsonb) from keg_anggota a),
    'jenis',   (select coalesce(jsonb_agg(to_jsonb(j) order by j.urutan, j.nama), '[]'::jsonb) from keg_jenis j),
    'kegiatan',(select coalesce(jsonb_agg(to_jsonb(k) order by k.dibuat desc), '[]'::jsonb) from keg_kegiatan k),
    'penugasan',(select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from keg_penugasan p),
    'foto',    (select coalesce(jsonb_agg(to_jsonb(f) order by f.dibuat), '[]'::jsonb) from keg_foto f),
    'sbm',     (select coalesce(jsonb_agg(to_jsonb(s) order by s.urutan), '[]'::jsonb) from keg_sbm s),
    'kota',    (select coalesce(jsonb_agg(to_jsonb(t) order by t.kota), '[]'::jsonb) from keg_transport_kota t),
    'config',  (select coalesce(jsonb_object_agg(c.kunci, c.nilai), '{}'::jsonb) from keg_config_public c)
  );
end $$;

-- ---------- 4. Pengali jadi 2 (PP tiap ujung) ----------
-- Dibuktikan tiga kali di SPJ 2026:
--   Bali   (250+219) x2 = 938.000  = SPD 07/10/2026
--   NTT    (250+105) x2 = 710.000  = SPD 20/07/2026
--   Jatim  (250+225) x2 = 950.000  = SPD 15/04/2026
insert into keg_config (kunci, nilai) values ('faktor_transport','2')
on conflict (kunci) do update set nilai = '2';

-- ---------- Lihat hasilnya ----------
select kota as nama,
       case when tarif = 0 then 'at-cost (bensin/tol, tidak masuk kantong)'
            else to_char(tarif, 'FM999G999G999') || ' PP' end as tarif
  from keg_transport_kota order by kota;
