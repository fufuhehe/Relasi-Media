/* Kalender: petaTanggal, kalLevel, geser bulan, bulan awal.
   Kasus batas yang wajib: kegiatan multi-hari kena SEMUA harinya,
   lintas bulan, lintas tahun, tahun kabisat, catatan tanpa tanggal
   tidak pernah masuk grid, dan orang yang ikut dua kegiatan sehari
   dihitung SEKALI. */
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
src+="\nmodule.exports={petaTanggal,kalBar,kalGeserBulan,kalBulanAwal,kalDaftar,"
 +"viewKalender,viewCatat,DB,setJenis:v=>{CATAT_JENIS=v},setLihat:v=>{LIHAT=v},"
 +"setBln:v=>{KAL_BLN=v},getBln:()=>KAL_BLN,setPin:p=>{PIN=p}};\n";
fs.writeFileSync('m20_'+FILE,src);
const M=require('./m20_'+FILE);
const {DB}=M;

DB.config={provinsi_basis:'DKI Jakarta',faktor_transport:'2',faktor_ketua:'1.2'};
DB.sbm=[{provinsi:'DKI Jakarta',uang_harian_luar:530000,uang_harian_dalam:210000,
  transport_dalam:170000,transport_luar:0,urutan:1}];
DB.kota=[]; DB.foto=[];
DB.anggota=[{id:1,nama:'Cika',kategori:'tim',aktif:true,urutan:1},
            {id:2,nama:'Riri',kategori:'tim',aktif:true,urutan:2},
            {id:3,nama:'Dedi',kategori:'tim',aktif:true,urutan:3},
            {id:4,nama:'Nonaktif',kategori:'tim',aktif:false,urutan:4}];
DB.jenis=[{id:1,nama:'Rapat',aktif:true,urutan:1},{id:2,nama:'Produksi',aktif:true,urutan:2}];
const K=o=>Object.assign({tier:'dalam_kota',jumlah_hari:1,hari_meeting:0,
  provinsi:'DKI Jakarta',kota:null,lokasi:'',tingkat_beban:2,jenis_id:1,
  ketua_id:null,judul:'',dibuat:'2026-01-01'},o);

console.log('--- petaTanggal: dasar ---');
DB.kegiatan=[K({id:10,tanggal:'2026-11-10'})];
DB.penugasan=[{kegiatan_id:10,anggota_id:1},{kegiatan_id:10,anggota_id:2}];
let pt=M.petaTanggal(DB.kegiatan);
cek('satu hari, dua orang', [pt['2026-11-10'].n,pt['2026-11-10'].orang], [1,2]);
cek('tanggal lain kosong', pt['2026-11-11']===undefined, true);

console.log('--- kegiatan multi-hari kena semua harinya ---');
DB.kegiatan=[K({id:11,tanggal:'2026-11-10',jumlah_hari:3})];
DB.penugasan=[{kegiatan_id:11,anggota_id:1}];
pt=M.petaTanggal(DB.kegiatan);
cek('3 hari -> 3 tanggal', Object.keys(pt).sort(), ['2026-11-10','2026-11-11','2026-11-12']);
cek('hari ke-3 tetap 1 orang', pt['2026-11-12'].orang, 1);
cek('hari ke-4 tidak kena', pt['2026-11-13']===undefined, true);

console.log('--- lintas bulan & lintas tahun ---');
DB.kegiatan=[K({id:12,tanggal:'2026-11-29',jumlah_hari:4})];
DB.penugasan=[{kegiatan_id:12,anggota_id:1}];
pt=M.petaTanggal(DB.kegiatan);
cek('29 Nov + 4 hari masuk Desember', Object.keys(pt).sort(),
  ['2026-11-29','2026-11-30','2026-12-01','2026-12-02']);
DB.kegiatan=[K({id:13,tanggal:'2026-12-31',jumlah_hari:2})];
DB.penugasan=[{kegiatan_id:13,anggota_id:1}];
pt=M.petaTanggal(DB.kegiatan);
cek('31 Des lewat ke tahun depan', Object.keys(pt).sort(), ['2026-12-31','2027-01-01']);
DB.kegiatan=[K({id:14,tanggal:'2028-02-28',jumlah_hari:2})];
DB.penugasan=[{kegiatan_id:14,anggota_id:1}];
pt=M.petaTanggal(DB.kegiatan);
cek('tahun kabisat kenal 29 Feb', Object.keys(pt).sort(), ['2028-02-28','2028-02-29']);

console.log('--- orang tumpang-tindih dihitung sekali ---');
DB.kegiatan=[K({id:20,tanggal:'2026-11-10'}),K({id:21,tanggal:'2026-11-10'})];
DB.penugasan=[{kegiatan_id:20,anggota_id:1},{kegiatan_id:20,anggota_id:2},
              {kegiatan_id:21,anggota_id:2},{kegiatan_id:21,anggota_id:3}];
pt=M.petaTanggal(DB.kegiatan);
cek('2 kegiatan sehari', pt['2026-11-10'].n, 2);
cek('Riri ikut dua-duanya tapi dihitung sekali', pt['2026-11-10'].orang, 3);

console.log('--- tanpa tanggal tidak pernah masuk grid ---');
DB.kegiatan=[K({id:30,tanggal:null}),K({id:31,tanggal:null,jumlah_hari:5})];
DB.penugasan=[{kegiatan_id:30,anggota_id:1},{kegiatan_id:31,anggota_id:2}];
cek('peta kosong total', Object.keys(M.petaTanggal(DB.kegiatan)).length, 0);

console.log('--- kalBar: lebar batang relatif anggota aktif ---');
cek('nol orang -> batang nol', M.kalBar(0,8), 0);
cek('4 dari 8 -> 50%', M.kalBar(4,8), 50);
cek('8 dari 8 -> penuh', M.kalBar(8,8), 100);
cek('lebih banyak dari yang aktif tetap dibatasi 100', M.kalBar(12,8), 100);
cek('tanpa anggota aktif tidak bagi nol', M.kalBar(3,0), 100);
/* Lantai 14%: tanpa ini 1 dari 13 jadi 8% alias 4px -- hari berisi
   terbaca kosong. */
cek('1 dari 13 dinaikkan ke lantai 14%', M.kalBar(1,13), 14);
cek('1 dari 100 pun tetap kelihatan', M.kalBar(1,100), 14);
cek('yang sudah di atas lantai tidak diutak-atik', M.kalBar(5,13), 38);

console.log('--- geser bulan ---');
cek('Nov +1 -> Des', M.kalGeserBulan('2026-11',1), '2026-12');
cek('Des +1 -> Jan tahun depan', M.kalGeserBulan('2026-12',1), '2027-01');
cek('Jan -1 -> Des tahun lalu', M.kalGeserBulan('2026-01',-1), '2025-12');
cek('Mar -1 -> Feb, tetap dua digit', M.kalGeserBulan('2026-03',-1), '2026-02');

console.log('--- bulan awal: jatuh ke bulan terakhir yang ada isinya ---');
DB.kegiatan=[K({id:40,tanggal:'2026-03-04'}),K({id:41,tanggal:'2026-05-09'})];
DB.penugasan=[{kegiatan_id:40,anggota_id:1},{kegiatan_id:41,anggota_id:1}];
M.setJenis(0);
cek('bulan ini kosong -> ambil Mei', M.kalBulanAwal(), '2026-05');
DB.kegiatan.push(K({id:42,tanggal:new Date().toISOString().slice(0,10)}));
DB.penugasan.push({kegiatan_id:42,anggota_id:1});
cek('bulan ini ada isinya -> ambil bulan ini', M.kalBulanAwal(), new Date().toISOString().slice(0,7));

console.log('--- filter jenis ikut berlaku ---');
DB.kegiatan=[K({id:50,tanggal:'2026-11-10',jenis_id:1}),
             K({id:51,tanggal:'2026-11-11',jenis_id:2})];
DB.penugasan=[{kegiatan_id:50,anggota_id:1},{kegiatan_id:51,anggota_id:2}];
M.setJenis(0);
cek('semua jenis -> 2 tanggal', Object.keys(M.petaTanggal(M.kalDaftar())).sort(),
  ['2026-11-10','2026-11-11']);
M.setJenis(2);
cek('jenis Produksi saja -> 1 tanggal', Object.keys(M.petaTanggal(M.kalDaftar())), ['2026-11-11']);
M.setJenis(0);

console.log('--- render grid ---');
M.setBln('2026-11'); M.setLihat('kalender'); M.setPin('1234');
let h=M.viewCatat();
cek('judul bulan tampil', h.indexOf('November 2026')>=0, true);
cek('30 sel tanggal buat November', (h.match(/data-aksi="kal-tgl"/g)||[]).length, 30);
cek('tidak ada lagi kelas ramp latar', /class="kcell k[1-4]/.test(h), false);
cek('tiap sel punya jalur batang', (h.match(/<u>/g)||[]).length>=30, true);
/* 1 Nov 2026 hari Minggu, jadi tidak ada sel kosong di depan. */
cek('1 Nov 2026 jatuh Minggu, tanpa sel kosong di depan',
  (h.match(/class="kcell nihil"/g)||[]).length, 0);
cek('aksi toggle tidak memakai nama "lihat"', h.indexOf('data-aksi="lihat"')>=0, false);
cek('toggle balik ke daftar ada', h.indexOf('data-aksi="kal-lihat" data-v="daftar"')>=0, true);
M.setBln('2026-02');
h=M.viewCatat();
cek('Februari 2026 ada 28 sel', (h.match(/data-aksi="kal-tgl"/g)||[]).length, 28);
/* 1 Feb 2026 hari Minggu juga; 2026-12-01 hari Selasa -> 2 sel kosong. */
M.setBln('2026-12');
h=M.viewCatat();
cek('1 Des 2026 hari Selasa -> 2 sel kosong di depan',
  (h.match(/class="kcell nihil"/g)||[]).length, 2);
cek('31 sel buat Desember', (h.match(/data-aksi="kal-tgl"/g)||[]).length, 31);

console.log('--- mode daftar tidak ikut kebawa ---');
M.setLihat('daftar');
h=M.viewCatat();
cek('daftar tidak menggambar grid', h.indexOf('class="kgrid"')>=0, false);
cek('daftar menawarkan tombol Kalender', h.indexOf('data-aksi="kal-lihat" data-v="kalender"')>=0, true);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
