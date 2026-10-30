/* t16 — app tetap hidup kalau 25-tujuan.sql belum dijalankan */
const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const ok=JSON.stringify(d)===JSON.stringify(h);if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'   dapat '+JSON.stringify(d)+' harus '+JSON.stringify(h)));}
let panggilan=[];
global.fetch=(url,opt)=>{
  const body=JSON.parse(opt.body||'{}');
  panggilan.push(body);
  if('p_kota' in body)
    return Promise.resolve({ok:false,status:404,
      text:()=>Promise.resolve('{"message":"Could not find the function public.keg_simpan_kegiatan(p_kota,...) in the schema cache"}')});
  return Promise.resolve({ok:true,json:()=>Promise.resolve(1),text:()=>Promise.resolve("1")});};
global.document={querySelector:(q)=>(q==="#lapis"?null:{textContent:'',innerHTML:'',value:'',querySelectorAll:()=>[],classList:{add(){},remove(){}}}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  body:{appendChild(){},removeChild(){}},addEventListener(){},
  documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={rinciJalan,kotaKeg,opsiTujuan,simpanKegiatan,muat,DB,setPin:p=>{PIN=p},setForm:f=>{FORM=f}};\n";
fs.writeFileSync('q_'+FILE,src);
const M=require('./q_'+FILE), {DB}=M;

console.log('--- database lama: belum ada daftar tujuan ---');
DB.config={provinsi_basis:'DKI Jakarta',faktor_transport:'2'};
DB.sbm=[{provinsi:'DKI Jakarta',uang_harian_luar:530000,uang_harian_dalam:210000,transport_dalam:170000,transport_luar:0,taksi:250000},
        {provinsi:'Jawa Barat',uang_harian_luar:430000,uang_harian_dalam:170000,transport_dalam:0,transport_luar:0,taksi:180000}];
DB.kota=[];
const K=o=>Object.assign({tier:'luar_pp',jumlah_hari:1,hari_meeting:0,provinsi:null,kota:null,lokasi:'',tingkat_beban:2},o);
cek('tanpa daftar tujuan tidak meledak', M.kotaKeg(K({kota:'Kota Depok'})), null);
cek('jatuh ke hitungan provinsi',
  M.rinciJalan(K({kota:'Kota Depok',provinsi:'Jawa Barat'})).transport, (250000+180000)*2);
cek('dropdown tetap kebentuk', (M.opsiTujuan('','Jawa Barat').match(/<optgroup/g)||[]).length, 1);

console.log('--- catatan lama: kolom kota belum ada ---');
cek('kegiatan tanpa properti kota aman',
  M.rinciJalan({tier:'dalam_kota',provinsi:'DKI Jakarta',jumlah_hari:1,hari_meeting:0}).transport, 170000);

console.log('--- simpan: fungsi lama belum kenal p_kota ---');
DB.kota=[{kota:'Kota Depok',provinsi:'Jawa Barat',tarif:496000,urutan:5}];
M.setPin('1234');
M.setForm({id:null,jenis_id:1,judul:'uji',tanggal:null,jumlah_hari:1,lokasi:'',
  tier:'luar_pp',tingkat_beban:2,ketua_id:null,catatan:'',provinsi:'',
  kota:'Kota Depok',hari_meeting:0,orang:{7:true},ubahBobot:false});
panggilan=[];
Promise.resolve(M.simpanKegiatan()).then(function(){
  var simpan=panggilan.filter(b=>'p_tier' in b);
  cek('dicoba dua kali', simpan.length, 2);
  cek('percobaan pertama bawa tujuan', 'p_kota' in simpan[0], true);
  cek('percobaan kedua tanpa tujuan', 'p_kota' in simpan[1], false);
  cek('data lain tetap utuh', simpan[1].p_provinsi===null&&simpan[1].p_tier==='luar_pp', true);
  console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
  process.exit(gagal?1:0);
}).catch(function(e){console.log('GAGAL meledak:',e.message);process.exit(1);});
