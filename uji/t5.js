const fs=require('fs');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'  dapat '+a+' harus '+b));}

function jalankan(file,pref,alih){
  const src=fs.readFileSync(file,'utf8');
  let pindah=null, LS={}, SS={};
  if(pref!==null) LS["keg_tampilan"]=pref;
  if(alih) SS["keg_alih"]=alih;
  const ctx={
    localStorage:{getItem:k=>(k in LS?LS[k]:null),setItem:(k,v)=>{LS[k]=String(v);},
      removeItem:k=>{delete LS[k];}},
    sessionStorage:{getItem:k=>(k in SS?SS[k]:null),setItem:(k,v)=>{SS[k]=String(v);},
      removeItem:k=>{delete SS[k];}},
    location:{replace:u=>{pindah=u;}}
  };
  const f=new Function('localStorage','sessionStorage','location',src);
  f(ctx.localStorage,ctx.sessionStorage,ctx.location);
  return {pindah:pindah, alihDipasang:SS["keg_alih"]||null};
}

console.log('--- dari index.html (Windows 98) ---');
cek('belum pernah pilih: diam', jalankan('index_head.js',null,null).pindah, null);
cek('pilih win: diam', jalankan('index_head.js','win',null).pindah, null);
cek('pilih ios: pindah', jalankan('index_head.js','ios',null).pindah, './ios.html');
cek('nilai ngaco: diam', jalankan('index_head.js','xxx',null).pindah, null);
cek('string kosong: diam', jalankan('index_head.js','',null).pindah, null);

console.log('--- dari ios.html ---');
cek('belum pernah pilih: diam', jalankan('ios_head.js',null,null).pindah, null);
cek('pilih ios: diam', jalankan('ios_head.js','ios',null).pindah, null);
cek('pilih win: pindah', jalankan('ios_head.js','win',null).pindah, './index.html');
cek('nilai ngaco: diam', jalankan('ios_head.js','zzz',null).pindah, null);

console.log('--- penjaga putaran ---');
cek('index: penanda alih sudah ada -> diam',
  jalankan('index_head.js','ios','1').pindah, null);
cek('ios: penanda alih sudah ada -> diam',
  jalankan('ios_head.js','win','1').pindah, null);
cek('saat pindah, penanda dipasang',
  jalankan('index_head.js','ios',null).alihDipasang, '1');

console.log('--- simulasi putaran terburuk ---');
// anggap KEDUA file keliru mengira dirinya yang lain (skenario mustahil, tapi diuji)
let lompat=0, SS={}, LS={keg_tampilan:'ios'};
function langkah(file){
  const src=fs.readFileSync(file,'utf8');
  let pindah=null;
  new Function('localStorage','sessionStorage','location',src)(
    {getItem:k=>(k in LS?LS[k]:null),setItem:(k,v)=>{LS[k]=v;},removeItem:k=>{delete LS[k];}},
    {getItem:k=>(k in SS?SS[k]:null),setItem:(k,v)=>{SS[k]=v;},removeItem:k=>{delete SS[k];}},
    {replace:u=>{pindah=u;}});
  return pindah;
}
let kini='index_head.js';
while(lompat<10){
  const p=langkah(kini);
  if(!p) break;
  lompat++;
  kini = p.indexOf('ios')>=0 ? 'ios_head.js' : 'index_head.js';
}
cek('berhenti setelah 1 lompatan, tidak memutar', lompat, 1);
cek('mendarat di ios', kini, 'ios_head.js');

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
