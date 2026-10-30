const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}

global.RENDER=0; global.STAT=[]; global.RPC=[]; global.DOKGAGAL=false;
global.fetch=function(url,opt){
  if(url.indexOf('/rpc/keg_daftar_dokumen')>=0){
    RPC.push('dokumen');   /* fitur sudah dibuang; dipakai untuk memastikan TIDAK dipanggil */
    if(DOKGAGAL) return Promise.resolve({ok:false,status:404,
      text:()=>Promise.resolve('{"message":"function does not exist"}')});
    return Promise.resolve({ok:true,text:()=>Promise.resolve("[]")});}
  if(url.indexOf('/rest/v1/keg_')>=0)
    return Promise.resolve({ok:true,json:()=>Promise.resolve([])});
  return Promise.resolve({ok:true,json:()=>Promise.resolve([]),text:()=>Promise.resolve("{}")});
};
global.document={querySelector:()=>({textContent:'',innerHTML:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  addEventListener(){},documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src=src.replace(/function render\(\)\{/,'function render(){ RENDER++; if(1) return;');
{
  const i=src.indexOf('function stat(m){');
  let d=0,j=src.indexOf('{',i);
  for(let k=j;k<src.length;k++){ if(src[k]==='{')d++; else if(src[k]==='}'){d--; if(!d){j=k;break;}} }
  src=src.slice(0,i)+'function stat(m){STAT.push(m);}'+src.slice(j+1);
}
src+="\nmodule.exports={muat,DB,setPin:p=>{PIN=p}};\n";
fs.writeFileSync('e_'+FILE,src);
const M=require('./e_'+FILE);

console.log('--- muat() WAJIB selalu nge-render ---');
RENDER=0; STAT.length=0; RPC.length=0; M.setPin(null);
M.muat().then(function(){
  cek('mode lihat: render dipanggil', RENDER, 1);
  cek('mode lihat: status selesai', STAT[STAT.length-1].indexOf('catatan kegiatan')>=0, true);
  cek('mode lihat: dokumen tidak diminta', RPC.length, 0);

  RENDER=0; STAT.length=0; RPC.length=0; M.setPin('1234');
  return M.muat();
}).then(function(){
  cek('mode admin: render tetap dipanggil', RENDER, 1);
  cek('mode admin: status selesai', STAT[STAT.length-1].indexOf('catatan kegiatan')>=0, true);
  cek('mode admin: fungsi dokumen TIDAK diminta lagi', RPC.length, 0);

  console.log('--- SQL belum dijalankan: app harus tetap hidup ---');
  RENDER=0; STAT.length=0; DOKGAGAL=true;
  return M.muat();
}).then(function(){
  cek('fungsi dokumen error: render tetap jalan', RENDER, 1);
  cek('status tetap selesai, bukan nyangkut',
    STAT[STAT.length-1].indexOf('catatan kegiatan')>=0, true);
  console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
  process.exit(gagal?1:0);
}).catch(e=>{console.log('ERROR:',e);process.exit(1);});
