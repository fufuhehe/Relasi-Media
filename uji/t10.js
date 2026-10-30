const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}

global.EL={}; global.DIPASANG=[];
function buatEl(){return {id:'',className:'',innerHTML:'',parentNode:null,
  appendChild(){},removeChild(){},addEventListener(e,f){DIPASANG.push(e);},
  querySelector(){return {src:''};},setAttribute(){},getAttribute(){return null},style:{}};}
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([]),text:()=>Promise.resolve("[]")});
global.document={
  getElementById:(id)=>EL[id]||null,
  querySelector:()=>({textContent:'',innerHTML:''}),querySelectorAll:()=>[],
  createElement:()=>{const e=buatEl(); EL.__baru=e; return e;},
  body:{appendChild(e){e.parentNode=global.document.body; EL[e.id]=e;},
        removeChild(e){delete EL[e.id];}},
  addEventListener(){},documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={fotoSampul,bukaLB,tutupLB,geserLB,gambarLB,fotoHTML,viewCatat,"
 +"FOTO_URL,DB,setPin:p=>{PIN=p},getLB:()=>LB};\n";
fs.writeFileSync('j_'+FILE,src);
const M=require('./j_'+FILE);
const {DB}=M;
DB.config={}; DB.jenis=[{id:1,nama:'Monev',tier:'dalam_kota',tingkat_beban:2,aktif:true}];
DB.anggota=[{id:1,nama:'Astrid',kategori:'tim',aktif:true}];
DB.kegiatan=[{id:7,jenis_id:1,judul:'',tanggal:'2026-10-20',jumlah_hari:1,lokasi:'',
  tier:'dalam_kota',tingkat_beban:2,ketua_id:null,catatan:'',dibuat:'1'}];
DB.penugasan=[{kegiatan_id:7,anggota_id:1}];
DB.foto=[{id:1,kegiatan_id:7,path:'7/a.jpg',sampul:false,dibuat:'1',keterangan:''},
         {id:2,kegiatan_id:7,path:'7/b.jpg',sampul:false,dibuat:'2',keterangan:''},
         {id:3,kegiatan_id:7,path:'7/c.jpg',sampul:false,dibuat:'3',keterangan:''}];
M.FOTO_URL['7/a.jpg']='u/a'; M.FOTO_URL['7/b.jpg']='u/b'; M.FOTO_URL['7/c.jpg']='u/c';
M.setPin('1234'); 
console.log('--- pilih sampul ---');
cek('belum ada yang dipilih -> foto pertama', M.fotoSampul(7).id, 1);
DB.foto[2].sampul=true;
cek('yang ditandai dipakai', M.fotoSampul(7).id, 3);
cek('kegiatan tanpa foto aman', M.fotoSampul(99), null);

console.log('--- thumbnail daftar ikut sampul ---');
let h=M.viewCatat();
cek('thumbnail pakai foto sampul', h.indexOf('data-fpath="7/c.jpg"')>=0, true);
cek('bukan foto pertama', h.indexOf('class="kthumb" data-fpath="7/a.jpg"')>=0, false);
DB.foto[2].sampul=false;

console.log('--- grid detail ---');
h=M.fotoHTML(7);
cek('3 foto dirender', (h.match(/data-fpath=/g)||[]).length, 3);
cek('indeks ikut dikirim', [h.indexOf('data-i="0"')>=0,h.indexOf('data-i="2"')>=0], [true,true]);
cek('kegiatan jadi sasaran, bukan path', h.indexOf('data-aksi="foto-besar" data-v="7"')>=0, true);
DB.foto[1].sampul=true;
h=M.fotoHTML(7);
cek('sampul ditandai di grid', (h.match(/class="smp"/g)||[]).length, 1);
DB.foto[1].sampul=false;

console.log('--- penampil geser ---');
M.bukaLB(7,0);
cek('terbuka di foto pertama', M.getLB().i, 0);
let lb=EL['lb'];
cek('elemen dibuat', !!lb, true);
cek('penanda urutan 1 / 3', lb.innerHTML.indexOf('1 / 3')>=0, true);
cek('gambar yang dipakai benar', lb.innerHTML.indexOf('src="u/a"')>=0, true);
cek('listener geser dipasang', DIPASANG.indexOf('touchstart')>=0 && DIPASANG.indexOf('touchend')>=0, true);
M.geserLB(1);
cek('maju ke foto kedua', M.getLB().i, 1);
cek('gambar ikut berubah', EL['lb'].innerHTML.indexOf('src="u/b"')>=0, true);
M.geserLB(1); M.geserLB(1);
cek('dari terakhir balik ke awal', M.getLB().i, 0);
M.geserLB(-1);
cek('mundur dari awal ke terakhir', M.getLB().i, 2);

console.log('--- tombol sampul di penampil ---');
cek('ada tombol jadikan sampul', EL['lb'].innerHTML.indexOf('lb-sampul')>=0, true);
cek('membawa id foto yang tampil', EL['lb'].innerHTML.indexOf('data-v="3"')>=0, true);
DB.foto[2].sampul=true; M.gambarLB();
cek('yang sudah jadi sampul: tanpa tombol', EL['lb'].innerHTML.indexOf('lb-sampul')>=0, false);
cek('diberi keterangan', EL['lb'].innerHTML.indexOf('Ini sampulnya')>=0, true);
DB.foto[2].sampul=false;
M.setPin(null); M.gambarLB();
cek('mode lihat: tidak ada tombol sampul', EL['lb'].innerHTML.indexOf('lb-sampul')>=0, false);
M.setPin('1234');

console.log('--- satu foto saja: tanpa panah ---');
DB.foto=[DB.foto[0]];
M.bukaLB(7,0);
cek('tidak ada tombol maju', EL['lb'].innerHTML.indexOf('lb-next')>=0, false);
cek('tidak ada penanda urutan', EL['lb'].innerHTML.indexOf(' / ')>=0, false);
M.geserLB(1);
cek('geser diabaikan', M.getLB().i, 0);

console.log('--- tutup ---');
M.tutupLB();
cek('state dibersihkan', M.getLB(), null);
cek('elemen dibuang', !!EL['lb'], false);

console.log('--- kolom sampul belum ada (SQL belum dijalankan) ---');
DB.foto=[{id:1,kegiatan_id:7,path:'7/a.jpg',dibuat:'1',keterangan:''},
         {id:2,kegiatan_id:7,path:'7/b.jpg',dibuat:'2',keterangan:''}];
cek('tetap jalan, pakai foto pertama', M.fotoSampul(7).id, 1);
cek('daftar tetap terender', M.viewCatat().indexOf('data-fpath="7/a.jpg"')>=0, true);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
