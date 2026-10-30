const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}

global.LISTENER={};
global.UNGGAH=[];
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([]),text:()=>Promise.resolve("{}")});
global.document={querySelector:()=>({textContent:'',innerHTML:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null},click(){}}),
  addEventListener:function(ev,fn){ (LISTENER[ev]=LISTENER[ev]||[]).push(fn); },
  documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={};
global.HOVER=true;
global.window={matchMedia:(q)=>({matches:q.indexOf("hover")>=0?HOVER:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src=src.replace(/function unggahBanyak\(kegId,files\)\{/,
  'function unggahBanyak(kegId,files){ UNGGAH.push({keg:kegId,n:files.length}); if(1) return;');
src+="\nmodule.exports={pasangTempel,fotoHTML,adaMouse,DB,"
 +"setPin:p=>{PIN=p},setKeg:k=>{MODAL_KEG=k},getKeg:()=>MODAL_KEG,"
 +"bukaModal,tutupModal};\n";
fs.writeFileSync('c_'+FILE,src);
const M=require('./c_'+FILE);
M.DB.foto=[]; M.DB.config={};
M.pasangTempel();

function ev(tipe,isi){
  let dicegah=false;
  const e={preventDefault:()=>{dicegah=true;}};
  if(tipe==='paste') e.clipboardData={items:isi};
  else e.dataTransfer={files:isi};
  (LISTENER[tipe]||[]).forEach(f=>f(e));
  return dicegah;
}
const gbr=(t)=>({kind:"file",type:t,getAsFile:()=>({type:t,nama:t})});
const teks=()=>({kind:"string",type:"text/plain",getAsFile:()=>null});

console.log('--- tempel (Ctrl+V) ---');
M.setPin('1234'); M.setKeg(7); UNGGAH.length=0;
cek('gambar di clipboard diunggah', ev('paste',[gbr("image/png")]), true);
cek('masuk ke kegiatan yang kebuka', UNGGAH, [{keg:7,n:1}]);

UNGGAH.length=0;
cek('teks biasa diabaikan', ev('paste',[teks()]), false);
cek('tidak ada unggahan', UNGGAH.length, 0);

UNGGAH.length=0;
ev('paste',[gbr("image/png"),teks(),gbr("image/jpeg")]);
cek('campuran: ambil 2 gambar saja', UNGGAH, [{keg:7,n:2}]);

console.log('--- penjaga ---');
UNGGAH.length=0; M.setKeg(null);
cek('tanpa modal terbuka: diabaikan', ev('paste',[gbr("image/png")]), false);
cek('tidak mengunggah', UNGGAH.length, 0);
M.setKeg(7); M.setPin(null);
cek('tanpa PIN: diabaikan', ev('paste',[gbr("image/png")]), false);
cek('tidak mengunggah', UNGGAH.length, 0);

console.log('--- seret & lepas ---');
M.setPin('1234'); M.setKeg(9); UNGGAH.length=0;
cek('file gambar diterima', ev('drop',[{type:"image/jpeg"},{type:"image/png"}]), true);
cek('dua foto ke kegiatan 9', UNGGAH, [{keg:9,n:2}]);
UNGGAH.length=0;
cek('PDF ditolak', ev('drop',[{type:"application/pdf"}]), false);
cek('tidak mengunggah', UNGGAH.length, 0);
UNGGAH.length=0;
ev('drop',[{type:"image/png"},{type:"application/pdf"}]);
cek('campuran: gambar saja yang diambil', UNGGAH, [{keg:9,n:1}]);

console.log('--- modal berganti harus mereset sasaran ---');
M.setKeg(9); M.bukaModal("Lain","isi");
cek('bukaModal lain mereset sasaran', M.getKeg(), null);
M.setKeg(9); M.tutupModal();
cek('tutup modal mereset sasaran', M.getKeg(), null);

console.log('--- petunjuk hanya untuk perangkat bermouse ---');
M.setPin('1234'); HOVER=true;
cek('ada mouse: petunjuk tampil', /tempel|Ctrl\+V/i.test(M.fotoHTML(7)), true);
HOVER=false;
cek('layar sentuh: petunjuk disembunyikan', /Ctrl\+V/i.test(M.fotoHTML(7)), false);
HOVER=true;

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
