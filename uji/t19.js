/* Catatan tanpa tanggal TIDAK ikut rekap per tahun (aturan baru 12 Nov 2026),
   tapi tetap ikut di "semua waktu" -- dan peringatannya tidak boleh hilang. */
const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}

global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([]),text:()=>Promise.resolve("[]")});
global.document={querySelector:()=>({textContent:'',innerHTML:'',value:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  body:{appendChild(){},removeChild(){}},
  addEventListener(){},documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={rekap,dalamPeriode,batas,ringkasHTML,DB,PERIODE,"
 +"setTab:t=>{TAB=t}};\n";
fs.writeFileSync('m19_'+FILE,src);
const M=require('./m19_'+FILE);
const {DB,PERIODE}=M;

DB.config={provinsi_basis:'DKI Jakarta',faktor_transport:'2',faktor_ketua:'1.2'};
DB.sbm=[{provinsi:'DKI Jakarta',uang_harian_luar:530000,uang_harian_dalam:210000,
  transport_dalam:170000,transport_luar:0,urutan:1}];
DB.kota=[];
DB.anggota=[{id:1,nama:'Cika',kategori:'tim',aktif:true,urutan:1}];
DB.jenis=[{id:1,nama:'Rapat',urutan:1},{id:2,nama:'Produksi',urutan:2}];
const K=o=>Object.assign({tier:'dalam_kota',jumlah_hari:1,hari_meeting:0,
  provinsi:'DKI Jakarta',kota:null,lokasi:'',tingkat_beban:2,jenis_id:1,ketua_id:null},o);
DB.kegiatan=[
  K({id:10,tanggal:'2026-03-04'}),            // tahun ini
  K({id:11,tanggal:'2025-08-09'}),            // tahun lalu
  K({id:12,tanggal:null}),                    // belum bertanggal
  K({id:13,tanggal:null,jenis_id:2})];        // belum bertanggal, jenis lain
DB.penugasan=DB.kegiatan.map(k=>({kegiatan_id:k.id,anggota_id:1}));
DB.foto=[];
const cika=()=>M.rekap().filter(x=>x.id===1)[0];

console.log('--- rekap per tahun ---');
PERIODE.tahun=2026; PERIODE.jenis=0;
cek('2026: cuma yang bertanggal 2026', cika().n, 1);
cek('yang kosong tidak nyelip', cika().daftar.map(x=>x.k.id), [10]);
PERIODE.tahun=2025;
cek('2025: cuma yang bertanggal 2025', cika().daftar.map(x=>x.k.id), [11]);
PERIODE.tahun=2024;
cek('tahun tanpa catatan: nol, bukan kebagian yang kosong', cika().n, 0);

console.log('--- semua waktu tetap menghitung semuanya ---');
PERIODE.tahun=0;
cek('semua waktu: 4 catatan', cika().n, 4);
cek('yang kosong ikut', cika().daftar.map(x=>x.k.id), [10,11,12,13]);

console.log('--- dalamPeriode langsung ---');
cek('kosong + ada batas -> keluar', M.dalamPeriode({tanggal:null},{dari:'2026-01-01',sampai:'2026-12-31'}), false);
cek('kosong + tanpa batas -> ikut', M.dalamPeriode({tanggal:null},{dari:null,sampai:null}), true);

console.log('--- peringatan tidak boleh hilang ---');
/* Jebakannya: dulu blm dihitung dari arr yang SUDAH disaring dalamPeriode,
   jadi begitu yang kosong dikeluarkan, angkanya ikut jadi 0. */
M.setTab('orang'); PERIODE.tahun=2026; PERIODE.jenis=0;
let h=M.ringkasHTML();
cek('tab Tim tetap menyebut 2 belum bertanggal', h.indexOf('<b>2</b> belum bertanggal')>=0, true);
cek('dan bilang itu di luar hitungan', h.indexOf('(di luar hitungan)')>=0, true);
PERIODE.tahun=0;
h=M.ringkasHTML();
cek('di semua waktu tidak ditulis di luar hitungan', h.indexOf('(di luar hitungan)')>=0, false);
PERIODE.tahun=2026; PERIODE.jenis=2;
h=M.ringkasHTML();
cek('filter jenis ikut menyaring peringatannya', h.indexOf('<b>1</b> belum bertanggal')>=0, true);

PERIODE.tahun=new Date().getFullYear(); PERIODE.jenis=0; M.setTab('catat');
console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
