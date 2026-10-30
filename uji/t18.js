/* t18 — rekap per jenis kegiatan di layar orang */
const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const ok=JSON.stringify(d)===JSON.stringify(h);if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'   dapat '+JSON.stringify(d)+' harus '+JSON.stringify(h)));}
let OUT='';
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([])});
const el={innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){}},
  querySelector:()=>null,querySelectorAll:()=>[],scrollTop:0};
const lapis={set innerHTML(v){OUT=v;},get innerHTML(){return OUT;},
  querySelector:()=>null,querySelectorAll:()=>[]};
global.document={querySelector:(q)=>(q==='#lapis'?lapis:el),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  body:{appendChild(){},removeChild(){}},addEventListener(){},
  documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={perJenis,jenisHTML,detailOrang,rekap,DB,setPin:p=>{PIN=p},setPeriode:p=>{PERIODE=p}};\n";
fs.writeFileSync('s_'+FILE,src);
const M=require('./s_'+FILE), {DB}=M;

DB.config={provinsi_basis:'DKI Jakarta',faktor_transport:'2',faktor_ketua:'1.2'};
DB.sbm=[{provinsi:'DKI Jakarta',uang_harian_luar:530000,uang_harian_dalam:210000,
         transport_dalam:170000,transport_luar:0,taksi:250000,urutan:1},
        {provinsi:'Jawa Barat',uang_harian_luar:430000,uang_harian_dalam:170000,
         transport_dalam:0,transport_luar:0,taksi:180000,urutan:2}];
DB.kota=[{kota:'Kota Depok',provinsi:'Jawa Barat',tarif:496000,urutan:1}];
DB.jenis=[{id:1,nama:'Rapat bodetabek',tier:'luar_pp',tingkat_beban:2,aktif:true,paket_meeting:true},
          {id:2,nama:'Produksi konten',tier:'luar_pp',tingkat_beban:3,aktif:true,paket_meeting:false},
          {id:3,nama:'Diksi',tier:'dalam_kota',tingkat_beban:2,aktif:true,paket_meeting:false}];
DB.anggota=[{id:7,nama:'Chika',kategori:'tim',aktif:true,urutan:1}];
function K(id,jenis,extra){return Object.assign({id:id,jenis_id:jenis,judul:'',tanggal:'2026-0'+(id%9+1)+'-05',
  jumlah_hari:1,lokasi:'',tier:jenis===3?'dalam_kota':'luar_pp',tingkat_beban:2,ketua_id:null,
  catatan:'',provinsi:'DKI Jakarta',kota:null,hari_meeting:0,dibuat:'2026-01-01'},extra||{});}
/* Chika: 2x rapat bodetabek (meeting, 496rb), 1x produksi konten (496+430),
   3x diksi Jakarta (170+210) */
DB.kegiatan=[K(1,1,{kota:'Kota Depok',hari_meeting:1}),K(2,1,{kota:'Kota Depok',hari_meeting:1}),
             K(3,2,{kota:'Kota Depok'}),K(4,3),K(5,3),K(6,3)];
DB.penugasan=DB.kegiatan.map(k=>({kegiatan_id:k.id,anggota_id:7}));
DB.foto=[];
M.setPeriode({tahun:0,jenis:0,urut:'jalan'});

var r=null; M.rekap().forEach(function(x){if(x.id===7) r=x;});
var baris=M.perJenis(r.daftar);

console.log('--- pengelompokan ---');
cek('tiga jenis muncul', baris.length, 3);
cek('rapat bodetabek 2 kali', baris.filter(x=>x.nama==='Rapat bodetabek')[0].n, 2);
cek('diksi 3 kali', baris.filter(x=>x.nama==='Diksi')[0].n, 3);
cek('produksi konten 1 kali', baris.filter(x=>x.nama==='Produksi konten')[0].n, 1);

console.log('--- angkanya ---');
cek('rapat bodetabek 2 x 496rb (meeting, uang harian nol)',
  baris.filter(x=>x.nama==='Rapat bodetabek')[0].jalan, 992000);
cek('produksi konten 496rb + 430rb uang harian',
  baris.filter(x=>x.nama==='Produksi konten')[0].jalan, 926000);
cek('diksi 3 x (170rb + 210rb)',
  baris.filter(x=>x.nama==='Diksi')[0].jalan, 1140000);
cek('jumlahnya sama dengan total orangnya',
  baris.reduce((s,x)=>s+x.jalan,0), r.jalan);
cek('jumlah kalinya sama juga', baris.reduce((s,x)=>s+x.n,0), r.n);

console.log('--- urutan: duit terbesar duluan ---');
cek('urut menurun', baris.map(x=>x.nama), ['Diksi','Rapat bodetabek','Produksi konten']);

console.log('--- tampilan ---');
var h=M.jenisHTML(r.daftar);
cek('judulnya ada', h.indexOf('Per jenis kegiatan')>=0, true);
cek('tiga batang terender', (h.match(/class="bar"/g)||[]).length, 3);
cek('yang terbesar penuh 100%', /width:100%/.test(h), true);
cek('batang lain lebih pendek', (h.match(/width:100%/g)||[]).length, 1);
cek('tiap baris menulis jumlah kali', (h.match(/\d+× · <b>Rp/g)||[]).length, 3);
cek('dijelaskan batangnya mengikuti apa', h.indexOf('mengikuti rupiahnya')>=0, true);
cek('orang tanpa catatan: tidak menampilkan apa-apa', M.jenisHTML([]), "");

console.log('--- menyatu di layar orang ---');
M.setPin('1234'); M.detailOrang(7);
cek('muncul di modal', OUT.indexOf('Per jenis kegiatan')>=0, true);
cek('masih sebelum Riwayat',
  OUT.indexOf('Per jenis kegiatan') < OUT.indexOf('Riwayat'), true);
cek('tombol Tutup di dasar modal sudah dibuang',
  /data-aksi="tutup"[^>]*>Tutup</.test(OUT), false);
cek('tetap bisa ditutup dari title bar',
  (OUT.match(/data-aksi="tutup"/g)||[]).length, 1);

console.log('--- kasus batas ---');
DB.jenis=[];
cek('jenis terhapus tidak meledak', M.perJenis(r.daftar)[0].nama, '(kegiatan dihapus)');

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
