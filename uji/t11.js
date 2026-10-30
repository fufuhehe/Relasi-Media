const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}

// dunia: 'lama' = keg_data belum ada, 'baru' = sudah ada
global.DUNIA='lama'; global.SANDI_BENAR='relasi2026'; global.PIN_BENAR='1234';
global.REQ=[]; global.RENDER=0; global.STAT=[];
const DATA={anggota:[{id:1,nama:'Astrid',kategori:'tim',aktif:true}],
  jenis:[{id:1,nama:'Monev',tier:'dalam_kota',tingkat_beban:2,aktif:true}],
  kegiatan:[{id:7,jenis_id:1,judul:'',tanggal:'2026-10-20',jumlah_hari:1,lokasi:'',
    tier:'dalam_kota',tingkat_beban:2,ketua_id:null,catatan:'',dibuat:'1'}],
  penugasan:[{kegiatan_id:7,anggota_id:1}],
  foto:[{id:1,kegiatan_id:7,path:'7/a.jpg',sampul:false,dibuat:'1',keterangan:''}],
  config:{nama_tim:'Kerjaan Relasi Media'}};

global.fetch=function(url,opt){
  const body=opt&&opt.body?JSON.parse(opt.body):{};
  REQ.push({url:url.replace('https://wwgqgsjyaodxfuhjwksj.supabase.co',''),body:body});
  const teks=(ok,t)=>Promise.resolve({ok:ok,status:ok?200:400,
    text:()=>Promise.resolve(t),json:()=>Promise.resolve(JSON.parse(t))});
  if(url.indexOf('/rpc/keg_data')>=0){
    if(DUNIA==='lama') return Promise.resolve({ok:false,status:404,
      text:()=>Promise.resolve('{"message":"Could not find the function public.keg_data(p_sandi) in the schema cache"}')});
    if(body.p_sandi!==SANDI_BENAR && body.p_sandi!==PIN_BENAR)
      return teks(false,'{"message":"Sandi salah"}');
    return teks(true,JSON.stringify(DATA));
  }
  if(url.indexOf('/rpc/keg_cek_sandi')>=0)
    return teks(true, String(body.p_sandi===SANDI_BENAR||body.p_sandi===PIN_BENAR));
  if(url.indexOf('/rpc/keg_daftar_dokumen')>=0) return teks(true,'[]');
  if(url.indexOf('/rpc/')>=0) return teks(true,'true');
  if(url.indexOf('/functions/v1/bukti-upload')>=0)
    return teks(true,JSON.stringify({hasil:[{path:'7/a.jpg',signedUrl:'https://x/ef.jpg'}]}));
  if(url.indexOf('/storage/v1/object/sign/bukti')>=0){
    if(DUNIA==='baru') return Promise.resolve({ok:false,status:403,
      text:()=>Promise.resolve('denied'),json:()=>Promise.resolve({})});
    return Promise.resolve({ok:true,json:()=>Promise.resolve(
      [{path:'7/a.jpg',signedURL:'/object/sign/bukti/7/a.jpg?t=L'}])});
  }
  if(url.indexOf('/rest/v1/')>=0) return Promise.resolve({ok:true,json:()=>Promise.resolve(
    url.indexOf('keg_config_public')>=0?[{kunci:'nama_tim',nilai:'Lama'}]:[])});
  return teks(true,'{}');
};
const BOX={};
global.document={querySelector:(q)=>BOX[q]||(BOX[q]={textContent:'',innerHTML:'',value:''}),
  querySelectorAll:()=>[],getElementById:()=>null,
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null},click(){}}),
  body:{appendChild(){},removeChild(){}},
  addEventListener(){},documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={_:{},getItem(k){return this._[k]||null;},
  setItem(k,v){this._[k]=String(v);},removeItem(k){delete this._[k];}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src=src.replace(/function render\(\)\{/,'function render(){ RENDER++; if(1) return;');
{ const i=src.indexOf('function stat(m){'); let d=0,j=src.indexOf('{',i);
  for(let k=j;k<src.length;k++){ if(src[k]==='{')d++; else if(src[k]==='}'){d--; if(!d){j=k;break;}} }
  src=src.slice(0,i)+'function stat(m){STAT.push(m);}'+src.slice(j+1); }
src+="\nmodule.exports={muat,masukSandi,urlFotoBanyak,FOTO_URL,DB,viewGerbang,"
 +"setPin:p=>{PIN=p},setSandi:s=>{SANDI=s},getSandi:()=>SANDI,"
 +"getGerbang:()=>GERBANG,getBaru:()=>BARU,setBaru:b=>{BARU=b}};\n";
fs.writeFileSync('k_'+FILE,src);
const M=require('./k_'+FILE);

function reset(){REQ.length=0;RENDER=0;STAT.length=0;
  Object.keys(M.FOTO_URL).forEach(k=>delete M.FOTO_URL[k]);}

console.log('--- DUNIA LAMA: SQL belum dijalankan ---');
DUNIA='lama'; M.setSandi(''); M.setPin(null); reset();
M.muat().then(function(){
  cek('render tetap dipanggil', RENDER, 1);
  cek('tidak ada gerbang', M.getGerbang(), false);
  cek('tidak masuk mode baru', M.getBaru(), false);
  cek('data termuat lewat jalur lama', M.DB.config.nama_tim, 'Lama');
  cek('sempat coba pintu baru dulu', REQ[0].url, '/rest/v1/rpc/keg_data');
  cek('lalu jatuh ke REST lama', REQ.some(r=>r.url.indexOf('/rest/v1/keg_anggota')>=0), true);

  console.log('--- DUNIA BARU: belum punya sandi ---');
  DUNIA='baru'; M.setSandi(''); M.setPin(null); reset();
  return M.muat();
}).then(function(){
  cek('gerbang muncul', M.getGerbang(), true);
  cek('render tetap dipanggil', RENDER, 1);
  cek('TIDAK jatuh ke jalur lama', REQ.some(r=>r.url.indexOf('/rest/v1/keg_')>=0 && r.url.indexOf('rpc')<0), false);
  cek('layar gerbang minta sandi', M.viewGerbang().indexOf('inpSandi')>=0, true);
  cek('status memberi tahu', STAT.some(x=>/sandi/i.test(x)), true);

  console.log('--- masuk pakai sandi tim ---');
  reset(); BOX['#inpSandi']={value:' relasi2026 '};
  M.masukSandi();
  return new Promise(r=>setTimeout(r,60));
}).then(function(){
  cek('sandi tersimpan (spasi dibuang)', M.getSandi(), 'relasi2026');
  cek('ditulis ke localStorage', localStorage.getItem('keg_sandi'), 'relasi2026');
  cek('gerbang hilang', M.getGerbang(), false);
  cek('mode baru aktif', M.getBaru(), true);
  cek('data termuat', M.DB.kegiatan.length, 1);
  cek('config dari pintu baru', M.DB.config.nama_tim, 'Kerjaan Relasi Media');

  console.log('--- sandi salah ---');
  reset(); M.setSandi(''); BOX['#inpSandi']={value:'ngasal'};
  M.masukSandi();
  return new Promise(r=>setTimeout(r,60));
}).then(function(){
  cek('ditolak', STAT.some(x=>/[Ss]andi salah/.test(x)), true);
  cek('tidak tersimpan', M.getSandi(), '');

  console.log('--- PIN admin cukup, tanpa sandi tim ---');
  reset(); M.setSandi(''); M.setPin('1234');
  return M.muat();
}).then(function(){
  cek('bisa masuk', M.getGerbang(), false);
  cek('PIN dipakai sebagai sandi', M.getSandi(), '1234');
  cek('data termuat', M.DB.kegiatan.length, 1);

  console.log('--- tanda tangan foto ---');
  M.setBaru(true); reset();
  return M.urlFotoBanyak(['7/a.jpg']);
}).then(function(){
  cek('mode baru: lewat Edge Function',
    REQ[0].url, '/functions/v1/bukti-upload');
  cek('aksi sign + bawa sandi', [REQ[0].body.aksi, REQ[0].body.pin], ['sign','1234']);
  cek('TIDAK menembak storage langsung',
    REQ.some(r=>r.url.indexOf('/storage/v1')>=0), false);
  cek('URL penuh dipakai apa adanya', M.FOTO_URL['7/a.jpg'], 'https://x/ef.jpg');

  M.setBaru(false); DUNIA='lama'; reset();
  return M.urlFotoBanyak(['7/a.jpg']);
}).then(function(){
  cek('mode lama: langsung ke storage',
    REQ[0].url, '/storage/v1/object/sign/bukti');
  cek('path relatif dilengkapi', M.FOTO_URL['7/a.jpg'],
    'https://wwgqgsjyaodxfuhjwksj.supabase.co/storage/v1/object/sign/bukti/7/a.jpg?t=L');

  console.log('--- storage ditutup di tengah jalan ---');
  M.setBaru(false); DUNIA='baru'; reset();
  return M.urlFotoBanyak(['7/a.jpg']);
}).then(function(){
  cek('coba langsung dulu', REQ[0].url, '/storage/v1/object/sign/bukti');
  cek('lalu jatuh ke Edge Function',
    REQ.some(r=>r.url.indexOf('/functions/v1/bukti-upload')>=0), true);
  cek('foto tetap dapat URL', M.FOTO_URL['7/a.jpg'], 'https://x/ef.jpg');

  console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
  process.exit(gagal?1:0);
}).catch(e=>{console.log('ERROR:',e);process.exit(1);});
