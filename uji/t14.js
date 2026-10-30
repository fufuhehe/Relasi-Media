const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([]),text:()=>Promise.resolve("[]")});
global.document={querySelector:()=>({textContent:'',innerHTML:'',value:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  body:{appendChild(){},removeChild(){}},
  addEventListener(){},documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={transportLuar,skorJalan,rinciJalan,tarif,viewAdmin,DB,setPin:p=>{PIN=p}};\n";
fs.writeFileSync('n_'+FILE,src);
const M=require('./n_'+FILE);
const {DB}=M;
DB.config={provinsi_basis:'DKI Jakarta',uang_saku_fullboard:'130000',faktor_transport:'1'};
DB.sbm=[
 {provinsi:'DKI Jakarta',uang_harian_luar:530000,uang_harian_dalam:210000,transport_dalam:170000,transport_luar:0,taksi:250000,urutan:13},
 {provinsi:'Jawa Barat', uang_harian_luar:430000,uang_harian_dalam:170000,transport_dalam:0,transport_luar:0,taksi:180000,urutan:12},
 {provinsi:'Papua',      uang_harian_luar:580000,uang_harian_dalam:230000,transport_dalam:0,transport_luar:0,taksi:462000,urutan:33},
 {provinsi:'Papua Tengah',uang_harian_luar:580000,uang_harian_dalam:230000,transport_dalam:0,transport_luar:0,taksi:0,urutan:36},
 {provinsi:'Bali',       uang_harian_luar:480000,uang_harian_dalam:190000,transport_dalam:0,transport_luar:900000,taksi:219000,urutan:17}];
const K=(o)=>Object.assign({tier:'dalam_kota',jumlah_hari:1,hari_meeting:0,provinsi:null,tingkat_beban:2},o);

console.log('--- faktor 1: sekali jalan tiap ujung ---');
cek('Jawa Barat = 250 + 180', M.transportLuar(M.tarif('Jawa Barat')), 430000);
cek('Papua = 250 + 462', M.transportLuar(M.tarif('Papua')), 712000);

console.log('--- faktor 2: PP tiap ujung, efeknya langsung ---');
DB.config.faktor_transport='2';
cek('Jawa Barat jadi dua kali', M.transportLuar(M.tarif('Jawa Barat')), 860000);
cek('Papua jadi dua kali', M.transportLuar(M.tarif('Papua')), 1424000);
cek('ikut ke hitungan kegiatan',
  M.skorJalan(K({tier:'luar_pp',provinsi:'Jawa Barat'})), 430000+860000);
DB.config.faktor_transport='1';

console.log('--- angka manual menang ---');
cek('Bali dipakai apa adanya', M.transportLuar(M.tarif('Bali')), 900000);
cek('bukan hasil hitungan (250+219)', M.transportLuar(M.tarif('Bali'))===469000, false);

console.log('--- provinsi tanpa tarif terminal ---');
cek('Papua Tengah tetap nol', M.transportLuar(M.tarif('Papua Tengah')), 0);
let r=M.rinciJalan(K({tier:'luar_pp',provinsi:'Papua Tengah'}));
cek('uang harian tetap dihitung', r.uh, 580000);
cek('ditandai belum lengkap', r.lengkap, false);

console.log('--- contoh nyata tetap cocok ---');
cek('meeting Jakarta 1 hari tetap 170rb',
  M.skorJalan(K({tier:'dalam_kota',provinsi:'DKI Jakarta',hari_meeting:1})), 170000);
cek('non-meeting Jakarta tetap 380rb',
  M.skorJalan(K({tier:'dalam_kota',provinsi:'DKI Jakarta'})), 380000);

console.log('--- faktor aneh tidak merusak ---');
DB.config.faktor_transport='0';
cek('faktor 0 dipaksa minimal 1', M.transportLuar(M.tarif('Jawa Barat')), 430000);
DB.config.faktor_transport='';
cek('faktor kosong jatuh ke 1', M.transportLuar(M.tarif('Jawa Barat')), 430000);
DB.config.faktor_transport='1';
cek('tarif tak dikenal aman', M.transportLuar(null), 0);

console.log('--- panel admin ---');
M.setPin('1234'); DB.jenis=[]; DB.anggota=[];
const ah=M.viewAdmin();
cek('knob faktor transport ada', ah.indexOf('data-cfg="faktor_transport"')>=0, true);
cek('knob poin lama sudah hilang', /poin_dalam_kota|poin_luar_hari|poin_nginap_malam/.test(ah), false);
cek('yang manual ditandai', ah.indexOf('(manual)')>=0, true);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
