-- =========================================================
-- KUNCI APP DENGAN SANDI TIM
-- Jalankan di SQL Editor dashboard Supabase.
--
-- JALANKAN INI SETELAH index.html/ios.html versi baru sudah
-- naik ke GitHub. Frontend baru bisa jalan sebelum maupun
-- sesudah SQL ini, jadi tidak ada jeda mati.
--
-- Aman dijalankan ulang. Tidak menyentuh odop_*. Tidak ada DROP TABLE.
-- Skrip pembatalan ada di bagian paling bawah (dalam komentar).
-- =========================================================

-- ---------- 1. Sandi tim ----------
insert into keg_config (kunci, nilai) values ('sandi','relasi2026')
on conflict (kunci) do nothing;

-- view config TIDAK BOLEH membocorkan rahasia apa pun
create or replace view keg_config_public as
  select kunci, nilai from keg_config where kunci not in ('pin','sandi');

-- ---------- 2. Penjaga ----------
-- sandi tim ATAU PIN admin sama-sama boleh melihat
create or replace function keg__boleh_lihat(p text)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from keg_config
     where kunci in ('sandi','pin') and nilai = p and p is not null and p <> ''
  );
$$;

create or replace function keg_cek_sandi(p_sandi text)
returns boolean language sql security definer stable set search_path = public as $$
  select keg__boleh_lihat(p_sandi);
$$;

-- ---------- 3. Satu pintu baca ----------
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
    'config',  (select coalesce(jsonb_object_agg(c.kunci, c.nilai), '{}'::jsonb) from keg_config_public c)
  );
end $$;

grant execute on function keg_cek_sandi(text) to anon, authenticated;
grant execute on function keg_data(text)      to anon, authenticated;
revoke all on function keg__boleh_lihat(text) from anon, authenticated;

-- ---------- 4. Tutup jalur lama ----------
-- Tanpa ini, sandi hanya jadi pajangan: anon key ada di source yang publik,
-- jadi siapa pun bisa menembak REST API langsung tanpa membuka app.
revoke select on keg_anggota, keg_jenis, keg_kegiatan, keg_penugasan, keg_foto
  from anon, authenticated;
revoke select on keg_config_public from anon, authenticated;

drop policy if exists keg_anggota_read   on keg_anggota;
drop policy if exists keg_jenis_read     on keg_jenis;
drop policy if exists keg_kegiatan_read  on keg_kegiatan;
drop policy if exists keg_penugasan_read on keg_penugasan;
drop policy if exists keg_foto_read      on keg_foto;

-- ---------- 5. Tutup jalur foto ----------
-- Tanpa ini, foto tetap bisa ditandatangani siapa saja memakai anon key.
-- Penandatanganan pindah ke Edge Function bukti-upload yang memeriksa sandi.
drop policy if exists keg_bukti_read on storage.objects;

-- ---------- 6. Cek hasil ----------
select
  has_function_privilege('anon','keg_data(text)','EXECUTE')        as pintu_baru_siap,
  has_table_privilege('anon','keg_kegiatan','SELECT')              as anon_masih_bisa_baca_HARUS_FALSE,
  has_table_privilege('anon','keg_foto','SELECT')                  as anon_baca_foto_HARUS_FALSE,
  (select count(*) from pg_policies
     where tablename='objects' and policyname='keg_bukti_read')    as sisa_policy_foto_HARUS_0,
  (select nilai from keg_config where kunci='sandi')               as sandi_sekarang;

-- =========================================================
-- CARA MEMBATALKAN (kalau ada yang kacau, jalankan blok ini):
--
-- grant select on keg_anggota, keg_jenis, keg_kegiatan, keg_penugasan, keg_foto
--   to anon, authenticated;
-- grant select on keg_config_public to anon, authenticated;
-- create policy keg_anggota_read   on keg_anggota   for select to anon, authenticated using (true);
-- create policy keg_jenis_read     on keg_jenis     for select to anon, authenticated using (true);
-- create policy keg_kegiatan_read  on keg_kegiatan  for select to anon, authenticated using (true);
-- create policy keg_penugasan_read on keg_penugasan for select to anon, authenticated using (true);
-- create policy keg_foto_read      on keg_foto      for select to anon, authenticated using (true);
-- create policy keg_bukti_read on storage.objects for select to anon, authenticated
--   using (bucket_id = 'bukti');
-- =========================================================
