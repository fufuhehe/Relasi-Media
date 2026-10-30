-- =========================================================
-- SBM: hitung yang DITERIMA (uang harian + transport)
-- Sumber angka uang harian: PMK 32/2025 (SBM TA 2026)
-- Jalankan di SQL Editor. Aman diulang. Tidak menyentuh odop_*.
-- =========================================================

-- ---------- 1. Tabel tarif per provinsi ----------
create table if not exists keg_sbm (
  provinsi          text primary key,
  uang_harian_luar  int not null default 0,   -- per hari, dinas luar kota
  uang_harian_dalam int not null default 0,   -- per hari, dinas dalam kota >8 jam
  transport_dalam   int not null default 0,   -- PP, per hari kalau tidak menginap
  transport_luar    int not null default 0,   -- PP, dari Jakarta ke provinsi ini
  urutan            int  not null default 0
);

alter table keg_sbm enable row level security;
revoke all on keg_sbm from anon, authenticated;

-- uang harian: PMK 32/2025 Lampiran I bagian 28.1
insert into keg_sbm (provinsi, uang_harian_luar, uang_harian_dalam, urutan) values
 ('Aceh',360000,140000,1),('Sumatera Utara',370000,150000,2),('Riau',370000,150000,3),
 ('Kepulauan Riau',370000,150000,4),('Jambi',370000,150000,5),('Sumatera Barat',380000,150000,6),
 ('Sumatera Selatan',380000,150000,7),('Lampung',380000,150000,8),('Bengkulu',380000,150000,9),
 ('Bangka Belitung',410000,160000,10),('Banten',370000,150000,11),('Jawa Barat',430000,170000,12),
 ('DKI Jakarta',530000,210000,13),('Jawa Tengah',370000,150000,14),('DI Yogyakarta',420000,170000,15),
 ('Jawa Timur',410000,160000,16),('Bali',480000,190000,17),('Nusa Tenggara Barat',440000,180000,18),
 ('Nusa Tenggara Timur',430000,170000,19),('Kalimantan Barat',380000,150000,20),
 ('Kalimantan Tengah',360000,140000,21),('Kalimantan Selatan',380000,150000,22),
 ('Kalimantan Timur',430000,170000,23),('Kalimantan Utara',430000,170000,24),
 ('Sulawesi Utara',370000,150000,25),('Gorontalo',370000,150000,26),('Sulawesi Barat',410000,160000,27),
 ('Sulawesi Selatan',430000,170000,28),('Sulawesi Tengah',370000,150000,29),
 ('Sulawesi Tenggara',380000,150000,30),('Maluku',380000,150000,31),('Maluku Utara',430000,170000,32),
 ('Papua',580000,230000,33),('Papua Barat',480000,190000,34),('Papua Barat Daya',480000,190000,35),
 ('Papua Tengah',580000,230000,36),('Papua Selatan',580000,230000,37),('Papua Pegunungan',580000,230000,38)
on conflict (provinsi) do update set
  uang_harian_luar = excluded.uang_harian_luar,
  uang_harian_dalam = excluded.uang_harian_dalam,
  urutan = excluded.urutan;

-- transport: HANYA dua yang diketahui dari pengalaman nyata.
-- Sisanya 0 = belum diisi, app akan menandainya.
update keg_sbm set transport_dalam = 170000 where provinsi = 'DKI Jakarta';
update keg_sbm set transport_luar  = 540000 where provinsi = 'Jawa Barat';

-- ---------- 2. Kolom baru ----------
alter table keg_kegiatan add column if not exists provinsi text;
alter table keg_kegiatan add column if not exists hari_meeting int not null default 0;
alter table keg_jenis    add column if not exists paket_meeting boolean not null default false;

insert into keg_config (kunci, nilai) values
  ('uang_saku_fullboard','130000'), ('provinsi_basis','DKI Jakarta')
on conflict (kunci) do nothing;

-- ---------- 3. Tebak provinsi dari teks lokasi ----------
-- Hanya mengisi yang masih kosong. Yang tidak cocok dibiarkan null
-- supaya app memakai provinsi_basis dan menandainya sebagai tebakan.
with peta(pola, prov) as (values
  ('%jakarta%','DKI Jakarta'),('%jkt%','DKI Jakarta'),('%senayan%','DKI Jakarta'),
  ('%kemayoran%','DKI Jakarta'),('%thamrin%','DKI Jakarta'),('%sudirman%','DKI Jakarta'),
  ('%bogor%','Jawa Barat'),('%depok%','Jawa Barat'),('%bekasi%','Jawa Barat'),
  ('%bandung%','Jawa Barat'),('%cirebon%','Jawa Barat'),('%puncak%','Jawa Barat'),
  ('%cikarang%','Jawa Barat'),('%karawang%','Jawa Barat'),
  ('%bintaro%','Banten'),('%tangerang%','Banten'),('%serang%','Banten'),('%bsd%','Banten'),
  ('%anyer%','Banten'),('%cilegon%','Banten'),
  ('%semarang%','Jawa Tengah'),('%solo%','Jawa Tengah'),('%surakarta%','Jawa Tengah'),
  ('%magelang%','Jawa Tengah'),('%salatiga%','Jawa Tengah'),
  ('%yogya%','DI Yogyakarta'),('%jogja%','DI Yogyakarta'),('%sleman%','DI Yogyakarta'),
  ('%surabaya%','Jawa Timur'),('%malang%','Jawa Timur'),('%batu%','Jawa Timur'),
  ('%banyuwangi%','Jawa Timur'),('%sidoarjo%','Jawa Timur'),
  ('%bali%','Bali'),('%denpasar%','Bali'),('%badung%','Bali'),('%ubud%','Bali'),('%nusa dua%','Bali'),
  ('%medan%','Sumatera Utara'),('%danau toba%','Sumatera Utara'),('%samosir%','Sumatera Utara'),
  ('%padang%','Sumatera Barat'),('%bukittinggi%','Sumatera Barat'),
  ('%palembang%','Sumatera Selatan'),('%pekanbaru%','Riau'),('%batam%','Kepulauan Riau'),
  ('%tanjungpinang%','Kepulauan Riau'),('%jambi%','Jambi'),('%bengkulu%','Bengkulu'),
  ('%lampung%','Lampung'),('%bandar lampung%','Lampung'),
  ('%aceh%','Aceh'),('%banda aceh%','Aceh'),
  ('%bangka%','Bangka Belitung'),('%belitung%','Bangka Belitung'),('%pangkal%','Bangka Belitung'),
  ('%pontianak%','Kalimantan Barat'),('%palangka%','Kalimantan Tengah'),
  ('%banjarmasin%','Kalimantan Selatan'),('%banjarbaru%','Kalimantan Selatan'),
  ('%balikpapan%','Kalimantan Timur'),('%samarinda%','Kalimantan Timur'),
  ('%ikn%','Kalimantan Timur'),('%nusantara%','Kalimantan Timur'),
  ('%tarakan%','Kalimantan Utara'),
  ('%manado%','Sulawesi Utara'),('%likupang%','Sulawesi Utara'),('%gorontalo%','Gorontalo'),
  ('%makassar%','Sulawesi Selatan'),('%toraja%','Sulawesi Selatan'),('%palu%','Sulawesi Tengah'),
  ('%kendari%','Sulawesi Tenggara'),('%mamuju%','Sulawesi Barat'),
  ('%mataram%','Nusa Tenggara Barat'),('%lombok%','Nusa Tenggara Barat'),
  ('%kupang%','Nusa Tenggara Timur'),('%labuan bajo%','Nusa Tenggara Timur'),('%flores%','Nusa Tenggara Timur'),
  ('%ambon%','Maluku'),('%ternate%','Maluku Utara'),('%morotai%','Maluku Utara'),
  ('%jayapura%','Papua'),('%sorong%','Papua Barat Daya'),('%manokwari%','Papua Barat'),
  ('%timika%','Papua Tengah'),('%merauke%','Papua Selatan'),('%wamena%','Papua Pegunungan')
)
update keg_kegiatan k
   set provinsi = p.prov
  from (select distinct on (kk.id) kk.id, pt.prov
          from keg_kegiatan kk join peta pt on kk.lokasi ilike pt.pola
         where kk.provinsi is null and btrim(coalesce(kk.lokasi,'')) <> ''
         order by kk.id, length(pt.pola) desc) p
 where k.id = p.id;

-- ---------- 4. Fungsi tulis ----------
create or replace function keg_set_sbm(
  p_pin text, p_provinsi text, p_td int, p_tl int)
returns void language plpgsql security definer set search_path = public as $$
begin
  perform keg__wajib_pin(p_pin);
  update keg_sbm set transport_dalam = greatest(0,coalesce(p_td,0)),
                     transport_luar  = greatest(0,coalesce(p_tl,0))
   where provinsi = p_provinsi;
  if not found then raise exception 'Provinsi tidak dikenal'; end if;
end $$;

grant execute on function keg_set_sbm(text,text,int,int) to anon, authenticated;

-- ---------- 5. keg_data ikut mengirim tarif ----------
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
    'config',  (select coalesce(jsonb_object_agg(c.kunci, c.nilai), '{}'::jsonb) from keg_config_public c)
  );
end $$;

-- ---------- 6. Simpan kegiatan: ikut provinsi & hari_meeting ----------
create or replace function keg_simpan_kegiatan(
  p_pin text, p_id bigint, p_jenis_id bigint, p_judul text, p_tanggal date,
  p_jumlah_hari int, p_lokasi text, p_tier text, p_tingkat_beban int,
  p_ketua_id bigint, p_catatan text, p_orang jsonb,
  p_provinsi text default null, p_hari_meeting int default 0)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_hari int;
begin
  perform keg__wajib_pin(p_pin);
  v_hari := greatest(1, coalesce(p_jumlah_hari,1));
  if p_id is null then
    insert into keg_kegiatan (jenis_id,judul,tanggal,jumlah_hari,lokasi,tier,
                              tingkat_beban,ketua_id,catatan,provinsi,hari_meeting)
    values (p_jenis_id,coalesce(btrim(p_judul),''),p_tanggal,v_hari,
            coalesce(p_lokasi,''),p_tier,coalesce(p_tingkat_beban,2),p_ketua_id,
            coalesce(p_catatan,''), nullif(btrim(coalesce(p_provinsi,'')),''),
            least(greatest(0,coalesce(p_hari_meeting,0)), v_hari))
    returning id into v_id;
  else
    update keg_kegiatan set
      jenis_id=p_jenis_id, judul=coalesce(btrim(p_judul),''), tanggal=p_tanggal,
      jumlah_hari=v_hari, lokasi=coalesce(p_lokasi,''),
      tier=p_tier, tingkat_beban=coalesce(p_tingkat_beban,2), ketua_id=p_ketua_id,
      catatan=coalesce(p_catatan,''),
      provinsi=nullif(btrim(coalesce(p_provinsi,'')),''),
      hari_meeting=least(greatest(0,coalesce(p_hari_meeting,0)), v_hari)
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

grant execute on function keg_simpan_kegiatan(text,bigint,bigint,text,date,int,text,text,int,bigint,text,jsonb,text,int) to anon, authenticated;

create or replace function keg_simpan_jenis(
  p_pin text, p_id bigint, p_nama text, p_tier text, p_tingkat_beban int,
  p_aktif boolean, p_paket_meeting boolean default false)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint;
begin
  perform keg__wajib_pin(p_pin);
  if p_id is null then
    insert into keg_jenis (nama,tier,tingkat_beban,aktif,urutan,paket_meeting)
    values (btrim(p_nama),p_tier,coalesce(p_tingkat_beban,2),coalesce(p_aktif,true),
            coalesce((select max(urutan) from keg_jenis),0)+1, coalesce(p_paket_meeting,false))
    returning id into v_id;
  else
    update keg_jenis set nama=btrim(p_nama), tier=p_tier,
           tingkat_beban=coalesce(p_tingkat_beban,2), aktif=coalesce(p_aktif,true),
           paket_meeting=coalesce(p_paket_meeting,false)
     where id=p_id returning id into v_id;
  end if;
  return v_id;
end $$;

grant execute on function keg_simpan_jenis(text,bigint,text,text,int,boolean,boolean) to anon, authenticated;

-- ---------- 7. Hasil tebakan provinsi, buat dikoreksi ----------
select coalesce(provinsi,'(BELUM KETEBAK)') as provinsi,
       count(*) as jml,
       string_agg(distinct nullif(btrim(lokasi),''), ' | ' order by nullif(btrim(lokasi),'')) as contoh_lokasi
  from keg_kegiatan
 group by 1 order by 2 desc;
