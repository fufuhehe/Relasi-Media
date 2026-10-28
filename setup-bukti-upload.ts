// =========================================================
// Edge Function: bukti-upload  (VERSI 2 — dukung sandi tim)
// Dashboard Supabase -> Edge Functions -> bukti-upload -> ganti isinya
// Pastikan "Verify JWT" tetap MATI.
//
// Tempel ini SEBELUM menjalankan 21-sandi.sql.
// Versi ini masih jalan normal walau SQL sandi belum dijalankan.
// =========================================================
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type, apikey, authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const balas = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

// PIN admin saja (untuk unggah / hapus)
async function cekPin(sb: any, pin: string) {
  const { data, error } = await sb.rpc("keg_cek_pin", { p_pin: pin });
  if (error) throw new Error(error.message);
  return data === true;
}

// Sandi tim ATAU PIN admin (untuk melihat foto).
// Sebelum migrasi sandi dijalankan, keg_cek_sandi belum ada -> jatuh ke PIN.
async function bolehLihat(sb: any, sandi: string) {
  const { data, error } = await sb.rpc("keg_cek_sandi", { p_sandi: sandi });
  if (!error) return data === true;
  return await cekPin(sb, sandi);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { pin, aksi, kegiatan_id, tipe, path, paths } = await req.json();

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (!pin) return balas({ error: "Sandi kosong" }, 400);

    // --- tanda tangan URL foto: cukup sandi tim ---
    if (aksi === "sign") {
      if (!(await bolehLihat(sb, pin))) return balas({ error: "Sandi salah" }, 403);
      const daftar = Array.isArray(paths) ? paths.slice(0, 100) : [];
      if (!daftar.length) return balas({ hasil: [] });
      const { data, error } = await sb.storage
        .from("bukti")
        .createSignedUrls(daftar, 3600);
      if (error) return balas({ error: error.message }, 500);
      return balas({ hasil: data });
    }

    // --- sisanya wajib PIN admin ---
    if (!(await cekPin(sb, pin))) return balas({ error: "PIN salah" }, 403);

    if (aksi === "hapus") {
      if (!path) return balas({ error: "path kosong" }, 400);
      const { error } = await sb.storage.from("bukti").remove([path]);
      if (error) return balas({ error: error.message }, 500);
      return balas({ ok: true });
    }

    const id = Number(kegiatan_id);
    if (!Number.isInteger(id) || id <= 0)
      return balas({ error: "kegiatan_id tidak valid" }, 400);

    const ext = tipe === "image/png" ? "png" : tipe === "image/webp" ? "webp" : "jpg";
    const nama = `${id}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await sb.storage.from("bukti").createSignedUploadUrl(nama);
    if (error) return balas({ error: error.message }, 500);

    return balas({ url: data.signedUrl, path: nama });
  } catch (e) {
    return balas({ error: String(e) }, 500);
  }
});
