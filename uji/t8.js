const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}

global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([]),text:()=>Promise.resolve("[]")});
global.document={querySelector:()=>({textContent:'',innerHTML:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  addEventListener(){},documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={namaRingkas,viewCatat,DB,setPin:p=>{PIN=p}};\n";
fs.writeFileSync('h_'+FILE,src);
const M=require('./h_'+FILE);
const {DB}=M;
const TLCLS=FILE.indexOf('ios')>=0?'class="tl"':'class="jud"';
DB.config={}; DB.jenis=[{id:1,nama:'Monev',tier:'dalam_kota',tingkat_beban:2,aktif:true}];
const nm=['Astrid','Widi','Merlyn','Riri','Ika','Novie','Fahrul','Doni','Chika','Maul','Mirza','Ragil'];
DB.anggota=nm.map((x,i)=>({id:i+1,nama:x,kategori:'tim',aktif:true}));
DB.kegiatan=[
  {id:7,jenis_id:1,judul:'',tanggal:'2026-10-28',jumlah_hari:1,lokasi:'Aston',
   tier:'dalam_kota',tingkat_beban:2,ketua_id:1,catatan:'',dibuat:'1'},   // 12 orang
  {id:8,jenis_id:1,judul:'',tanggal:'2026-10-27',jumlah_hari:1,lokasi:'',
   tier:'dalam_kota',tingkat_beban:2,ketua_id:4,catatan:'',dibuat:'2'},   // 4 orang
  {id:9,jenis_id:1,judul:'',tanggal:'2026-10-26',jumlah_hari:1,lokasi:'',
   tier:'dalam_kota',tingkat_beban:2,ketua_id:null,catatan:'',dibuat:'3'} // 0 orang
];
DB.penugasan=[];
nm.forEach((x,i)=>DB.penugasan.push({kegiatan_id:7,anggota_id:i+1}));
[2,3,4,5].forEach(id=>DB.penugasan.push({kegiatan_id:8,anggota_id:id}));
DB.foto=[{id:1,kegiatan_id:8,path:'8/a.jpg',keterangan:'',dibuat:'1'},
         {id:2,kegiatan_id:8,path:'8/b.jpg',keterangan:'',dibuat:'2'}];

console.log('--- nama diringkas ---');
let r=M.namaRingkas(DB.kegiatan[0]);
cek('12 orang -> 4 nama + sisanya', (r.match(/,/g)||[]).length, 3);
cek('ada penanda "+8 lagi"', r.indexOf('+8 lagi')>=0, true);
cek('ketua ditaruh paling depan', r.indexOf('Astrid *')===0, true);
r=M.namaRingkas(DB.kegiatan[1]);
cek('4 orang: tampil semua', r.indexOf('lagi')>=0, false);
cek('ketua tetap didahulukan', r.indexOf('Riri *')===0, true);
cek('tanpa orang: ditandai', M.namaRingkas(DB.kegiatan[2]).indexOf('belum ada nama')>=0, true);

console.log('--- slot foto selalu ada (tepi kiri rata) ---');
M.setPin('1234'); let h=M.viewCatat();
cek('3 kartu, 3 slot foto', (h.match(/class="kthumb/g)||[]).length, 3);
cek('1 foto asli', (h.match(/<img class="kthumb"/g)||[]).length, 1);
cek('2 slot kosong', (h.match(/kthumb kosong/g)||[]).length, 2);

console.log('--- chip merah "belum ada foto" sudah hilang ---');
cek('tidak ada lagi chip merah di daftar', h.indexOf('belum ada foto</span>')>=0, false);
cek('slot kosong membawa keterangan', h.indexOf('title="belum ada foto"')>=0, true);

console.log('--- chip dibuang, link jadi ikon ---');
h=M.viewCatat();
cek('tidak ada lagi baris chip', h.indexOf('class="cips"')>=0, false);
cek('tidak ada lagi chip "N foto"', /\d+ foto<\/span>/.test(h), false);
cek('tidak ada lagi chip teks "link"', h.indexOf('>link<')>=0, false);
const blok=h.split('data-v="8"')[1].split('data-v="9"')[0];
cek('kartu bersih dari ikon dokumen', blok.indexOf('<svg')>=0, false);


console.log('--- mode lihat: ikon link disembunyikan ---');
M.setPin(null); h=M.viewCatat();
cek('thumbnail tetap jadi penanda foto', (h.match(/<img class="kthumb"/g)||[]).length, 1);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
