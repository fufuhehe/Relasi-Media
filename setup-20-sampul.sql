-- =========================================================
-- Pilih foto mana yang jadi sampul (thumbnail) kegiatan
-- Jalankan di SQL Editor dashboard Supabase.
-- Aman dijalankan ulang. Murni menambah: tidak ada DROP,
-- tidak menyentuh tabel lain, apalagi odop_*.
-- =========================================================

alter table keg_foto add column if not exists sampul boolean not null default false;

-- hanya satu sampul per kegiatan; fungsi ini yang menjaganya
create or replace function keg_set_sampul(p_pin text, p_id bigint)
returns void language plpgsql security definer set search_path = public as $$
declare v_keg bigint;
begin
  perform keg__wajib_pin(p_pin);
  select kegiatan_id into v_keg from keg_foto where id = p_id;
  if v_keg is null then raise exception 'Foto tidak ditemukan'; end if;
  update keg_foto set sampul = false where kegiatan_id = v_keg and sampul;
  update keg_foto set sampul = true  where id = p_id;
end $$;

grant execute on function keg_set_sampul(text,bigint) to anon, authenticated;

-- cek hasil
select
  (select count(*) from information_schema.columns
     where table_name='keg_foto' and column_name='sampul')            as kolom_siap,
  has_function_privilege('anon','keg_set_sampul(text,bigint)','EXECUTE') as fungsi_siap;
