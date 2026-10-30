const fs=require('fs');
/* Dulu file ini membaca app.js, salinan lama yang TIDAK ikut diperbarui
   ekstrak.js -- jadi diam-diam menguji kode basi. Sekarang ikut argv
   seperti tes lain. */
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}

global.REQ=[];
global.fetch=function(url,opt){
  REQ.push({url:url,body:opt&&opt.body});
  if(url.indexOf('/object/sign/bukti')>=0 && opt && JSON.parse(opt.body).paths){
    const ps=JSON.parse(opt.body).paths;
    return Promise.resolve({ok:true,json:()=>Promise.resolve(
      ps.map(p=>({path:p,signedURL:"/object/sign/bukti/"+p+"?token=T",error:null})))});
  }
  return Promise.resolve({ok:true,json:()=>Promise.resolve({signedURL:"/object/sign/bukti/x?token=S"})});
};
global.document={querySelector:()=>({textContent:'',innerHTML:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  addEventListener(){},documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={};global.window={};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={viewCatat,urlFotoBanyak,FOTO_URL,DB,"
 +"setPin:p=>{PIN=p},getBuka:()=>BULAN_BUKA,setBuka:b=>{BULAN_BUKA=b},"
 +"setJenis:j=>{CATAT_JENIS=j}};\n";
fs.writeFileSync('core_'+FILE,src);
const M=require('./core_'+FILE);
const {DB}=M;
DB.config={}; DB.jenis=[{id:1,nama:'Monev',tier:'dalam_kota',tingkat_beban:2,aktif:true}];
DB.anggota=[{id:1,nama:'Astrid',kategori:'tim',aktif:true}];
function K(id,tgl){return {id:id,jenis_id:1,judul:'',tanggal:tgl,jumlah_hari:1,lokasi:'',
  tier:'dalam_kota',tingkat_beban:2,ketua_id:null,catatan:'',dibuat:'2026-01-0'+(id%9)};}
DB.kegiatan=[K(1,'2026-10-28'),K(2,'2026-10-27'),K(3,'2026-09-15'),K(4,'2026-08-02'),K(5,null)];
DB.penugasan=[{kegiatan_id:1,anggota_id:1},{kegiatan_id:2,anggota_id:1},
  {kegiatan_id:3,anggota_id:1},{kegiatan_id:4,anggota_id:1},{kegiatan_id:5,anggota_id:1}];
DB.foto=[{id:1,kegiatan_id:2,path:'2/aa.jpg',keterangan:'',dibuat:'1'},
         {id:2,kegiatan_id:2,path:'2/bb.jpg',keterangan:'',dibuat:'2'},
         {id:3,kegiatan_id:3,path:'3/cc.jpg',keterangan:'',dibuat:'3'}];
M.setPin('1234');

console.log('--- accordion bulan ---');
M.setBuka(null);
let h=M.viewCatat();
const bln=(h.match(/data-bln="([0-9-]+)"/g)||[]);
cek('3 bulan jadi 3 accordion', bln.length, 3);
cek('urut terbaru dulu', bln, ['data-bln="2026-10"','data-bln="2026-09"','data-bln="2026-08"']);
cek('bulan terbaru terbuka', /data-bln="2026-10" open>/.test(h), true);
cek('bulan lama tertutup', /data-bln="2026-09" open>/.test(h), false);
cek('jumlah per bulan ditulis', /Oktober 2026 (<span class="meta">)?\(2\)/.test(h), true);
cek('belum bertanggal tetap terpisah', h.indexOf('Belum bertanggal (1)')>=0, true);
cek('state tersimpan', M.getBuka(), {'2026-10':true});

console.log('--- state bulan bertahan saat render ulang ---');
M.setBuka({'2026-08':true});
h=M.viewCatat();
cek('Agustus kini terbuka', /data-bln="2026-08" open>/.test(h), true);
cek('Oktober kini tertutup', /data-bln="2026-10" open>/.test(h), false);

console.log('--- thumbnail ---');
M.setBuka(null); h=M.viewCatat();
cek('kegiatan berfoto punya thumb', /class="kthumb"[^>]*data-fpath="2\/aa\.jpg"/.test(h), true);
cek('thumb pakai foto PERTAMA', h.indexOf('2/bb.jpg')>=0, false);
cek('2 kartu berthumb (keg 2 dan 3)', (h.match(/class="kthumb"/g)||[]).length, 2);
cek('tanpa foto: tidak ada thumb kosong',
  (h.match(/class="kthumb"/g)||[]).length < DB.kegiatan.length, true);
cek('tanpa foto: pakai slot kosong, bukan chip merah',
  [(h.match(/chip w">belum ada foto/g)||[]).length,
   (h.match(/kthumb kosong/g)||[]).length], [0,3]);
cek('tidak ada chip jumlah foto (thumbnail sudah mewakili)',
  /\d+ foto<\/span>/.test(h), false);
cek('kegiatan berfoto tetap punya thumbnail',
  (h.match(/<img class="kthumb"/g)||[]).length, 2);

console.log('--- batch signed URL (hemat request) ---');
REQ.length=0;
M.urlFotoBanyak(['2/aa.jpg','3/cc.jpg','2/bb.jpg']).then(function(){
  cek('SATU request untuk 3 foto', REQ.length, 1);
  cek('endpoint batch benar', REQ[0].url,
    'https://wwgqgsjyaodxfuhjwksj.supabase.co/storage/v1/object/sign/bukti');
  cek('kirim array paths', JSON.parse(REQ[0].body).paths.length, 3);
  cek('URL tersusun benar', M.FOTO_URL['2/aa.jpg'],
    'https://wwgqgsjyaodxfuhjwksj.supabase.co/storage/v1/object/sign/bukti/2/aa.jpg?token=T');
  REQ.length=0;
  return M.urlFotoBanyak(['2/aa.jpg','3/cc.jpg']);
}).then(function(){
  cek('yang sudah di-cache tidak diminta lagi', REQ.length, 0);
  REQ.length=0;
  const banyak=[]; for(let i=0;i<250;i++) banyak.push('x/'+i+'.jpg');
  return M.urlFotoBanyak(banyak);
}).then(function(){
  cek('250 foto dipecah jadi 3 request (maks 100)', REQ.length, 3);
  console.log('--- rupiah di tiap kartu ---');
/* Buat mencocokkan dengan daftar SPJ tanpa membuka satu-satu. Ditaruh di
   AWAL baris meta supaya jadi kolom yang rata kiri di semua kartu.
   Angkanya sendiri diuji di t15 yang punya tabel tarif lengkap. */
var dk=M.viewCatat();
cek('tiap kartu menulis angka', (dk.match(/<b class="duit"/g)||[]).length>0, true);
cek('angkanya SEBELUM tanggal, bukan di ujung baris',
  /<b class="duit"[^>]*>[^<]*<\/b> \u00b7 \d/.test(dk), true);
cek('nempel di baris meta yang sama, tidak bikin baris baru',
  /class="(meta|sb)"><b class="duit"/.test(dk), true);
cek('tarif belum ada ditandai "Rp ?", bukan diam-diam nol',
  /<b class="duit" title="tarif provinsi belum ada">Rp \?<\/b>/.test(dk), true);

console.log('--- thumbnail hemat data ---');
/* Thumbnail 46px memakai foto ASLI dari storage (bisa 2 MB per file).
   Tanpa loading=lazy, semua foto di daftar diunduh sekaligus waktu app
   dibuka -- di HP itu yang bikin kerasa lemot. */
var dft=M.viewCatat();
var thumb=(dft.match(/<img class="kthumb"[^>]*>/g)||[]);
cek('ada thumbnail yang terender', thumb.length>0, true);
cek('thumbnail ditunda sampai kelihatan', /loading=lazy/.test(thumb[0]||''), true);
cek('ukurannya ditulis biar tidak gonjang-ganjing', /width=46 height=46/.test(thumb[0]||''), true);
cek('decoding async', /decoding=async/.test(thumb[0]||''), true);
cek('slot kosong tetap tidak mengunduh apa-apa',
  (dft.match(/<span class="kthumb kosong"/g)||[]).length>0, true);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
  process.exit(gagal?1:0);
}).catch(e=>{console.log('ERROR:',e);process.exit(1);});
