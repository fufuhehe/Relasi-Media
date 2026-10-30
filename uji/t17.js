/* t17 — modal: title bar nempel, aksi utama kejangkau tanpa scroll */
const fs=require('fs');
const FILE=process.argv[2]||'index.js';
const HTML='/home/claude/relasi-media/'+(FILE==='ios.js'?'ios.html':'index.html');
let src=fs.readFileSync(FILE,'utf8'), css=fs.readFileSync(HTML,'utf8');
let gagal=0;
function cek(n,d,h){const ok=JSON.stringify(d)===JSON.stringify(h);if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'   dapat '+JSON.stringify(d)+' harus '+JSON.stringify(h)));}
let HTMLOUT='';
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([])});
const el={innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){}},
  querySelector:()=>null,querySelectorAll:()=>[],scrollTop:0};
global.document={querySelector:(q)=>(q==='#lapis'?lapis:el),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  body:{appendChild(){},removeChild(){}},addEventListener(){},
  documentElement:{getAttribute:()=>null,setAttribute(){}}};
const lapis={set innerHTML(v){HTMLOUT=v;},get innerHTML(){return HTMLOUT;},
  querySelector:()=>null,querySelectorAll:()=>[]};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={bukaModal,detailKegiatan,DB,setPin:p=>{PIN=p}};\n";
fs.writeFileSync('r_'+FILE,src);
const M=require('./r_'+FILE), {DB}=M;

DB.config={provinsi_basis:'DKI Jakarta',faktor_transport:'2'};
DB.sbm=[{provinsi:'DKI Jakarta',uang_harian_luar:530000,uang_harian_dalam:210000,
         transport_dalam:170000,transport_luar:0,taksi:250000,urutan:1}];
DB.kota=[]; DB.foto=[]; DB.penugasan=[]; DB.anggota=[];
DB.jenis=[{id:1,nama:'Rapat bodetabek',tier:'dalam_kota',tingkat_beban:2,aktif:true}];
DB.kegiatan=[{id:9,jenis_id:1,judul:'AGS November',tanggal:'2026-10-28',jumlah_hari:1,
  lokasi:'Aston Bintaro',tier:'dalam_kota',tingkat_beban:2,ketua_id:null,catatan:'',
  provinsi:'DKI Jakarta',kota:null,hari_meeting:0,dibuat:'2026-10-28'}];

console.log('--- title bar nempel ---');
cek('CSS sticky dipasang di title bar modal',
  /(\.modal \.tb|\.mhead)\{[^}]*position:sticky/.test(css), true);
cek('ada z-index biar isi tidak nimpa',
  /(\.modal \.tb|\.mhead)\{[^}]*z-index:/.test(css), true);

console.log('--- layar detail, mode admin ---');
M.setPin('1234'); M.detailKegiatan(9);
var head=HTMLOUT.slice(0,HTMLOUT.indexOf('class="body"'));
var body=HTMLOUT.slice(HTMLOUT.indexOf('class="body"'));
cek('Ubah ada di title bar', head.indexOf('data-aksi="edit-keg"')>=0, true);
cek('Ubah TIDAK ada lagi di bawah', body.indexOf('data-aksi="edit-keg"')>=0, false);
cek('tombol tutup (x) tetap di title bar', head.indexOf('data-aksi="tutup"')>=0, true);
cek('tombol "Tutup" di bawah sudah dibuang',
  /data-aksi="tutup"[^>]*>Tutup</.test(body), false);
cek('Salin ke WA tetap di bawah', body.indexOf('data-aksi="wa-keg"')>=0, true);
cek('cuma satu tombol tutup di seluruh modal',
  (HTMLOUT.match(/data-aksi="tutup"/g)||[]).length, 1);

console.log('--- layar detail, mode lihat ---');
M.setPin(null); M.detailKegiatan(9);
cek('tanpa PIN tidak ada tombol Ubah', HTMLOUT.indexOf('data-aksi="edit-keg"')>=0, false);
cek('tetap bisa ditutup', HTMLOUT.indexOf('data-aksi="tutup"')>=0, true);
cek('tetap bisa salin WA', HTMLOUT.indexOf('data-aksi="wa-keg"')>=0, true);

console.log('--- kata-kata di layar detail ---');
M.setPin('1234'); M.detailKegiatan(9);
cek('label jargon "Tier:" dibuang', /<b>Tier:<\/b>/.test(HTMLOUT), false);
cek('nilainya tetap ditulis', HTMLOUT.indexOf('Dalam kota')>=0||HTMLOUT.indexOf('dalam kota')>=0, true);
cek('judul foto diringkas jadi "Foto"', /Bukti dokumentasi/.test(HTMLOUT), false);

console.log('--- modal biasa tidak ikut berubah ---');
M.bukaModal('Judul biasa','<p>isi</p>');
cek('tanpa aksi: title bar cuma punya tutup',
  (HTMLOUT.match(/data-aksi="tutup"/g)||[]).length, 1);
cek('tidak kebocoran tombol aksi', HTMLOUT.indexOf('edit-keg')>=0, false);
M.bukaModal('Judul','<p>isi</p>','<button data-aksi="uji-aksi">Uji</button>');
cek('aksi tambahan muncul sebelum tombol tutup',
  HTMLOUT.indexOf('uji-aksi') < HTMLOUT.indexOf('data-aksi="tutup"'), true);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
