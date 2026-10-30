const fs=require('fs');
const FILE=process.argv[2]||'index.js';
const DIRI=FILE.indexOf('ios')>=0?'ios':'win';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'  dapat '+a+' harus '+b));}

global.LS={}; global.SS={}; global.PINDAH=null; global.STAT=[];
global.localStorage={getItem:k=>(k in LS?LS[k]:null),setItem:(k,v)=>{LS[k]=String(v);},
  removeItem:k=>{delete LS[k];}};
global.sessionStorage={getItem:k=>(k in SS?SS[k]:null),setItem:(k,v)=>{SS[k]=String(v);},
  removeItem:k=>{delete SS[k];}};
global.location={ get href(){return "";}, set href(u){PINDAH=u;}, replace:u=>{PINDAH=u;} };
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([]),text:()=>Promise.resolve("[]")});
global.document={querySelector:()=>({textContent:'',innerHTML:'',value:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null},click(){}}),
  addEventListener:function(ev,fn){ (global.L=global.L||{}), (L[ev]=L[ev]||[]).push(fn); },
  documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src=src.replace(/function render\(\)\{/,'function render(){ if(1) return;');
{ const i=src.indexOf('function stat(m){'); let d=0,j=src.indexOf('{',i);
  for(let k=j;k<src.length;k++){ if(src[k]==='{')d++; else if(src[k]==='}'){d--; if(!d){j=k;break;}} }
  src=src.slice(0,i)+'function stat(m){STAT.push(m);}'+src.slice(j+1); }
src+="\nmodule.exports={viewAdmin,setPin:p=>{PIN=p}};\n";
fs.writeFileSync('f_'+FILE,src);
const M=require('./f_'+FILE);

function klik(aksi,v){
  const t={getAttribute:k=>k==='data-aksi'?aksi:(k==='data-v'?v:null),closest(){return t;}};
  (L.click||[]).forEach(f=>f({target:{closest:()=>t},preventDefault(){}}));
}

console.log('--- kontrol di panel admin ('+DIRI+') ---');
M.setPin(null);
cek('belum login: kontrol tidak muncul', M.viewAdmin().indexOf('data-aksi="tampilan"')>=0, false);
M.setPin('1234');
const h=M.viewAdmin();
cek('login: kontrol muncul', h.indexOf('data-aksi="tampilan"')>=0, true);
cek('ada dua pilihan', (h.match(/data-aksi="tampilan"/g)||[]).length, 2);
const aktif=h.match(/data-v="(win|ios)" class="tekan"/);
cek('tampilan yang sedang dipakai ditandai', aktif&&aktif[1], DIRI);

console.log('--- menekan pilihan ---');
LS={}; SS={}; PINDAH=null; STAT.length=0;
klik('tampilan',DIRI);
cek('pilih yang sedang dipakai: tidak pindah', PINDAH, null);
cek('tetap tersimpan', LS["keg_tampilan"], DIRI);
cek('diberi tahu', STAT.some(x=>x.indexOf('sudah dipakai')>=0), true);

const LAIN = DIRI==='win'?'ios':'win';
LS={}; SS={keg_alih:'1'}; PINDAH=null; STAT.length=0;
klik('tampilan',LAIN);
cek('pilih yang lain: tersimpan', LS["keg_tampilan"], LAIN);
cek('pindah ke file pasangan', PINDAH, LAIN==='ios'?'./ios.html':'./index.html');
cek('penjaga putaran dibersihkan dulu', SS["keg_alih"], undefined);

LS={}; PINDAH=null;
klik('tampilan','ngaco');
cek('nilai ngaco diabaikan', PINDAH, null);
cek('tidak menyimpan apa pun', LS["keg_tampilan"], undefined);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
