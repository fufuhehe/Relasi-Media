-- =========================================================
-- Tujuan kegiatan: dipilih, bukan ditebak dari teks lokasi
--
-- Masalah yang diperbaiki: tarif kota dicocokkan dengan membaca
-- kolom lokasi. Catatan asli isinya nama venue ("Aston Bintaro"),
-- bukan nama kota, jadi tidak pernah ketemu dan jatuh ke rumus
-- provinsi -> Rp 1,47jt padahal SPJ-nya Rp 516rb.
--
-- Sekarang tujuan jadi PILIHAN di form, disimpan di kolomnya sendiri.
--
-- Sumber tarif: PMK 32/2025 hal. 68 bagian 2, "Satuan Biaya
-- Transportasi dari DKI Jakarta ke Kabupaten/Kota Sekitar (ONE WAY)".
-- Angka di bawah sudah dikali 2 karena diklaim Pergi/Pulang, dan
-- cocok persis dengan SPJ 2026: Depok 496rb, Bogor 540rb,
-- Bekasi 512rb, Tangerang Selatan 516rb.
--
-- Jalankan SETELAH 23-taksi.sql dan 24-transport-kota.sql.
-- Aman diulang.
-- =========================================================

-- ---------- 1. Daftar tujuan khusus ----------
create table if not exists keg_transport_kota (
  kota  text primary key,
  tarif int  not null default 0
);
alter table keg_transport_kota add column if not exists provinsi text;
alter table keg_transport_kota add column if not exists urutan   int not null default 0;

-- Isi ulang memakai nama resmi PMK. Baris lama dari 24-transport-kota.sql
-- pakai kunci huruf kecil ('bogor') dan sudah tidak dipakai lagi.
-- Tidak ada tabel lain yang menunjuk ke sini, jadi aman dikosongkan.
delete from keg_transport_kota;

insert into keg_transport_kota (kota, provinsi, tarif, urutan) values
  -- Bodetabek: one-way PMK x 2 (Pergi/Pulang)
  ('Kota Bekasi',            'Jawa Barat',  512000, 1),   -- 256.000 x2
  ('Kab. Bekasi',            'Jawa Barat',  512000, 2),   -- 256.000 x2
  ('Kota Bogor',             'Jawa Barat',  540000, 3),   -- 270.000 x2
  ('Kab. Bogor',             'Jawa Barat',  540000, 4),   -- 270.000 x2
  ('Kota Depok',             'Jawa Barat',  496000, 5),   -- 248.000 x2
  ('Kota Tangerang',         'Banten',      516000, 6),   -- 258.000 x2
  ('Kota Tangerang Selatan', 'Banten',      516000, 7),   -- 258.000 x2
  ('Kab. Tangerang',         'Banten',      558000, 8),   -- 279.000 x2
  ('Kepulauan Seribu',       'DKI Jakarta', 772000, 9),   -- 386.000 x2
  -- At-cost: bensin/tol/tiket diganti sesuai kuitansi, tidak ada
  -- yang masuk kantong. Tarif 0 di sini BERARTI nol, bukan belum diisi.
  ('Karawang',               'Jawa Barat',       0, 20),
  ('Bandung',                'Jawa Barat',       0, 21),
  ('Serang',                 'Banten',           0, 22);

alter table keg_transport_kota enable row level security;
revoke all on keg_transport_kota from anon, authenticated;

-- ---------- 2. Tujuan nempel di kegiatan ----------
alter table keg_kegiatan add column if not exists kota text;

-- ---------- 3. Tebak sekali untuk catatan lama ----------
-- Pola terpanjang menang, biar "Kab. Bogor" tidak kalah sama "bogor"
-- dan "tangerang selatan" tidak kalah sama "tangerang".
-- Ini SEKALI jalan, hasilnya bisa dikoreksi manual lewat form.
update keg_kegiatan k set kota = (
  select v.kota from (values
    ('%bintaro%',          'Kota Tangerang Selatan'),
    ('%tangerang selatan%','Kota Tangerang Selatan'),
    ('%tangsel%',          'Kota Tangerang Selatan'),
    ('%bsd%',              'Kota Tangerang Selatan'),
    ('%kab. tangerang%',   'Kab. Tangerang'),
    ('%kab tangerang%',    'Kab. Tangerang'),
    ('%tangerang%',        'Kota Tangerang'),
    ('%cibinong%',         'Kab. Bogor'),
    ('%kab. bogor%',       'Kab. Bogor'),
    ('%kab bogor%',        'Kab. Bogor'),
    ('%sentul%',           'Kab. Bogor'),
    ('%cisarua%',          'Kab. Bogor'),
    ('%puncak%',           'Kab. Bogor'),
    ('%bogor%',            'Kota Bogor'),
    ('%depok%',            'Kota Depok'),
    ('%cikarang%',         'Kab. Bekasi'),
    ('%kab. bekasi%',      'Kab. Bekasi'),
    ('%kab bekasi%',       'Kab. Bekasi'),
    ('%bekasi%',           'Kota Bekasi'),
    ('%karawang%',         'Karawang'),
    ('%bandung%',          'Bandung'),
    ('%serang%',           'Serang')
  ) as v(pola, kota)
  where lower(coalesce(k.lokasi,'')) like v.pola
  order by length(v.pola) desc
  limit 1)
where k.kota is null and coalesce(k.lokasi,'') <> '';

-- ---------- 4. keg_data kirim kolom barunya ----------
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
    'kota',    (select coalesce(jsonb_agg(to_jsonb(t) order by t.urutan), '[]'::jsonb) from keg_transport_kota t),
    'config',  (select coalesce(jsonb_object_agg(c.kunci, c.nilai), '{}'::jsonb) from keg_config_public c)
  );
end $$;

-- ---------- 5. Simpan kegiatan ikut menyimpan tujuan ----------
create or replace function keg_simpan_kegiatan(
  p_pin text, p_id bigint, p_jenis_id bigint, p_judul text, p_tanggal date,
  p_jumlah_hari int, p_lokasi text, p_tier text, p_tingkat_beban int,
  p_ketua_id bigint, p_catatan text, p_orang jsonb,
  p_provinsi text default null, p_hari_meeting int default 0,
  p_kota text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_hari int; v_kota text;
begin
  perform keg__wajib_pin(p_pin);
  v_hari := greatest(1, coalesce(p_jumlah_hari,1));
  -- hanya terima tujuan yang memang ada di daftar
  v_kota := nullif(btrim(coalesce(p_kota,'')),'');
  if v_kota is not null and not exists (select 1 from keg_transport_kota where kota = v_kota) then
    v_kota := null;
  end if;

  if p_id is null then
    insert into keg_kegiatan (jenis_id,judul,tanggal,jumlah_hari,lokasi,tier,
                              tingkat_beban,ketua_id,catatan,provinsi,hari_meeting,kota)
    values (p_jenis_id,coalesce(btrim(p_judul),''),p_tanggal,v_hari,
            coalesce(p_lokasi,''),p_tier,coalesce(p_tingkat_beban,2),p_ketua_id,
            coalesce(p_catatan,''), nullif(btrim(coalesce(p_provinsi,'')),''),
            least(greatest(0,coalesce(p_hari_meeting,0)), v_hari), v_kota)
    returning id into v_id;
  else
    update keg_kegiatan set
      jenis_id=p_jenis_id, judul=coalesce(btrim(p_judul),''), tanggal=p_tanggal,
      jumlah_hari=v_hari, lokasi=coalesce(p_lokasi,''),
      tier=p_tier, tingkat_beban=coalesce(p_tingkat_beban,2), ketua_id=p_ketua_id,
      catatan=coalesce(p_catatan,''),
      provinsi=nullif(btrim(coalesce(p_provinsi,'')),''),
      hari_meeting=least(greatest(0,coalesce(p_hari_meeting,0)), v_hari),
      kota=v_kota
    where id=p_id returning id into v_id;
    if v_id is null then raise exception 'Kegiatan tidak ditemukan'; end if;
  end if;

  if p_orang is not null then
    delete from keg_penugasan where kegiatan_id = v_id;
    insert into keg_penugasan (kegiatan_id, anggota_id)
    select v_id, (e)::text::bigint from jsonb_array_elements(p_orang) e
    on conflict do nothing;
  end if;
  return v_id;
end $$;

grant execute on function keg_simpan_kegiatan(text,bigint,bigint,text,date,int,text,text,int,bigint,text,jsonb,text,int,text) to anon, authenticated;

-- ---------- 6. Ubah tarif tujuan dari panel admin ----------
create or replace function keg_set_transport_kota(
  p_pin text, p_kota text, p_tarif int, p_provinsi text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_kota text;
begin
  perform keg__wajib_pin(p_pin);
  v_kota := btrim(coalesce(p_kota,''));
  if v_kota = '' then raise exception 'Nama tujuan kosong'; end if;
  insert into keg_transport_kota (kota, provinsi, tarif, urutan)
  values (v_kota, nullif(btrim(coalesce(p_provinsi,'')),''), greatest(0,coalesce(p_tarif,0)),
          coalesce((select max(urutan) from keg_transport_kota),0)+1)
  on conflict (kota) do update
    set tarif = excluded.tarif,
        provinsi = coalesce(excluded.provinsi, keg_transport_kota.provinsi);
end $$;
revoke all on function keg_set_transport_kota(text,text,int,text) from public;
grant execute on function keg_set_transport_kota(text,text,int,text) to anon;

-- ---------- Lihat hasil tebakan, koreksi lewat form kalau meleset ----------
select coalesce(kota,'(provinsi saja)') as tujuan,
       count(*) as jumlah_catatan,
       string_agg(distinct lokasi, ' | ' order by lokasi) as lokasi_yang_kebaca
  from keg_kegiatan
 group by 1
 order by 2 desc;
