/* Ukur biaya render daftar dengan data sebesar punya Ibot */
const fs=require('fs');
let src=fs.readFileSync('index.js','utf8');
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([])});
global.document={querySelector:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  body:{appendChild(){},removeChild(){}},addEventListener(){},
  documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={rinciJalan,skorJalan,rekap,viewCatat,viewOrang,kotaKeg,tarif,DB,setPeriode:p=>{PERIODE=p}};\n";
fs.writeFileSync('u.js',src);
const M=require('./u.js'), {DB}=M;

DB.config={provinsi_basis:'DKI Jakarta',faktor_transport:'2',nama_tim:'Kerjaan Relasi Media'};
const PROV=['DKI Jakarta','Jawa Barat','Banten','Bali','Nusa Tenggara Timur','Jawa Timur',
  'Sumatera Utara','Sulawesi Selatan','Papua','Kalimantan Timur'];
DB.sbm=[];
for(let i=0;i<38;i++) DB.sbm.push({provinsi:PROV[i%PROV.length]+(i<PROV.length?'':' '+i),
  uang_harian_luar:430000,uang_harian_dalam:170000,transport_dalam:i?0:170000,
  transport_luar:0,taksi:200000+i*1000,urutan:i});
DB.kota=[];
['Kota Bekasi','Kab. Bekasi','Kota Bogor','Kab. Bogor','Kota Depok','Kota Tangerang',
 'Kota Tangerang Selatan','Kab. Tangerang','Kepulauan Seribu','Karawang','Bandung','Serang']
 .forEach((n,i)=>DB.kota.push({kota:n,provinsi:'Jawa Barat',tarif:i>8?0:500000+i*1000,urutan:i}));
DB.anggota=[]; for(let i=1;i<=12;i++) DB.anggota.push({id:i,nama:'Orang '+i,kategori:i>11?'tu':'tim',aktif:true,urutan:i});
DB.jenis=[]; for(let i=1;i<=8;i++) DB.jenis.push({id:i,nama:'Kegiatan '+i,tier:'luar_pp',tingkat_beban:2,aktif:true,urutan:i,paket_meeting:i%2===0});
DB.kegiatan=[]; DB.penugasan=[]; DB.foto=[];
const N=parseInt(process.argv[2]||'87',10);
for(let i=1;i<=N;i++){
  DB.kegiatan.push({id:i,jenis_id:(i%8)+1,judul:'Catatan nomor '+i,
    tanggal:'2026-'+String((i%12)+1).padStart(2,'0')+'-'+String((i%28)+1).padStart(2,'0'),
    jumlah_hari:(i%3)+1,lokasi:'Hotel Anu nomor '+i,tier:['dalam_kota','luar_pp','luar_inap'][i%3],
    tingkat_beban:(i%3)+1,ketua_id:(i%12)+1,catatan:'',dibuat:'2026-01-01',
    provinsi:PROV[i%PROV.length],kota:i%2?DB.kota[i%12].kota:null,hari_meeting:i%2});
  for(let a=1;a<=12;a++) if((i+a)%2) DB.penugasan.push({kegiatan_id:i,anggota_id:a});
  if(i%3) DB.foto.push({kegiatan_id:i,path:i+'/x.jpg',dibuat:'2026-01-01',sampul:false});
}
M.setPeriode({tahun:0,jenis:0,urut:'jalan'});
function ukur(nama,fn,n){
  fn(); // pemanasan
  const t0=process.hrtime.bigint();
  for(let i=0;i<n;i++) fn();
  const ms=Number(process.hrtime.bigint()-t0)/1e6/n;
  console.log('  '+nama.padEnd(28)+ms.toFixed(2)+' ms');}
console.log(N+' catatan, '+DB.penugasan.length+' penugasan, 12 orang\n');
ukur('rekap()', ()=>M.rekap(), 200);
ukur('viewCatat() daftar', ()=>M.viewCatat(), 50);
ukur('viewOrang() rekap tim', ()=>M.viewOrang(), 50);
ukur('rinciJalan() x semua', ()=>{DB.kegiatan.forEach(k=>M.rinciJalan(k));}, 200);
ukur('kotaKeg() x semua', ()=>{DB.kegiatan.forEach(k=>M.kotaKeg(k));}, 500);
ukur('tarif() x semua', ()=>{DB.kegiatan.forEach(k=>M.tarif(k.provinsi));}, 500);
