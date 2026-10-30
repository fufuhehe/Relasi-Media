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
src+="\nmodule.exports={skorJalan,rinciJalan,rupiah,tarif,provKeg,caraHitung,viewAdmin,"
 +"skorBeban,bulat,DB,setPin:p=>{PIN=p}};\n";
fs.writeFileSync('m_'+FILE,src);
const M=require('./m_'+FILE);
const {DB}=M;
DB.config={provinsi_basis:'DKI Jakarta',uang_saku_fullboard:'130000',faktor_ketua:'1.2'};
DB.sbm=[
 {provinsi:'DKI Jakarta',uang_harian_luar:530000,uang_harian_dalam:210000,transport_dalam:170000,transport_luar:0,urutan:13},
 {provinsi:'Jawa Barat', uang_harian_luar:430000,uang_harian_dalam:170000,transport_dalam:0,transport_luar:540000,urutan:12},
 {provinsi:'Bangka Belitung',uang_harian_luar:410000,uang_harian_dalam:160000,transport_dalam:0,transport_luar:0,urutan:10}];
const K=(o)=>Object.assign({tier:'dalam_kota',jumlah_hari:1,hari_meeting:0,provinsi:null,
  tingkat_beban:2,tanggal:null},o);

console.log('--- lima contoh nyata dari Ibot ---');
cek('meeting hotel Jakarta 1 hari = 170rb',
  M.skorJalan(K({tier:'dalam_kota',provinsi:'DKI Jakarta',hari_meeting:1})), 170000);
cek('non-meeting Jakarta 1 hari = 380rb',
  M.skorJalan(K({tier:'dalam_kota',provinsi:'DKI Jakarta',hari_meeting:0})), 380000);
cek('meeting Bogor 1 hari = 540rb',
  M.skorJalan(K({tier:'luar_pp',provinsi:'Jawa Barat',hari_meeting:1})), 540000);
cek('produksi konten Bogor 1 hari = 970rb',
  M.skorJalan(K({tier:'luar_pp',provinsi:'Jawa Barat',hari_meeting:0})), 970000);
/* Dikoreksi 30 Okt: hari yang ditanggung panitia TIDAK dapat uang harian
   sama sekali -- uang saku fullboard 130rb dibuang atas keputusan Ibot. */
cek('3 hari nginap Jabar, meeting hari ke-2 = 2xUH + transport sekali',
  M.skorJalan(K({tier:'luar_inap',provinsi:'Jawa Barat',jumlah_hari:3,hari_meeting:1})),
  2*430000 + 540000);

console.log('--- aturan transport: SEKALI per perjalanan ---');
/* Dikoreksi dari dugaan awal "berulang tiap hari". SPJ 2026 membuktikan
   satu SPD = satu klaim transport, berapa pun harinya:
   Kab. Bekasi 2 hari = 512.000, Bali 3 hari = 938.000, NTT 3 hari = 710.000. */
cek('dalam kota 3 hari nempel: tetap sekali',
  M.rinciJalan(K({tier:'dalam_kota',provinsi:'DKI Jakarta',jumlah_hari:3})).transport, 170000);
cek('nginap 5 hari: transport sekali',
  M.rinciJalan(K({tier:'luar_inap',provinsi:'Jawa Barat',jumlah_hari:5})).transport, 540000);
cek('luar kota PP 2 hari bolak-balik: tetap sekali',
  M.rinciJalan(K({tier:'luar_pp',provinsi:'Jawa Barat',jumlah_hari:2})).transport, 540000);

console.log('--- paket meeting ---');
cek('meeting pulang hari: tidak ada uang saku',
  M.rinciJalan(K({tier:'luar_pp',provinsi:'Jawa Barat',hari_meeting:1})).uh, 0);
cek('meeting nginap juga nol, bukan 130rb',
  M.rinciJalan(K({tier:'luar_inap',provinsi:'Jawa Barat',jumlah_hari:2,hari_meeting:2})).uh, 0);
cek('hari_meeting melebihi jumlah hari dibatasi',
  M.rinciJalan(K({tier:'luar_inap',provinsi:'Jawa Barat',jumlah_hari:2,hari_meeting:9})).uh, 0);

console.log('--- provinsi kosong pakai basis ---');
cek('provinsi null -> DKI Jakarta', M.provKeg(K({})), 'DKI Jakarta');
cek('ikut tarif Jakarta', M.skorJalan(K({tier:'dalam_kota'})), 380000);

console.log('--- transport belum diisi ditandai ---');
let r=M.rinciJalan(K({tier:'luar_pp',provinsi:'Bangka Belitung'}));
cek('uang harian tetap dihitung', r.uh, 410000);
cek('transport nol', r.transport, 0);
cek('ditandai belum lengkap', r.lengkap, false);
r=M.rinciJalan(K({tier:'luar_pp',provinsi:'Jawa Barat'}));
cek('yang sudah diisi: lengkap', r.lengkap, true);
r=M.rinciJalan(K({provinsi:'Provinsi Antah Berantah'}));
cek('provinsi tak dikenal: tidak meledak', [r.total,r.tarifAda], [0,false]);

console.log('--- format rupiah ---');
cek('ratusan ribu', M.rupiah(540000), 'Rp 540rb');
cek('tepat 1 juta', M.rupiah(1000000), 'Rp 1jt');
cek('jutaan desimal pakai koma', M.rupiah(1530000), 'Rp 1,5jt');
cek('puluhan juta dibulatkan', M.rupiah(12400000), 'Rp 12jt');
cek('nol', M.rupiah(0), 'Rp 0');
cek('negatif tidak bocor', M.rupiah(-5), 'Rp 0');
cek('tidak ada artefak float', M.rupiah(0.1+0.2), 'Rp 0');

console.log('--- skor beban tidak ikut jadi rupiah ---');
cek('beban tetap poin', M.skorBeban(K({tier:'dalam_kota',jumlah_hari:3}),false), 6);
cek('ketua tetap 1.2x', M.bulat(M.skorBeban(K({}),true)), 2.4);

console.log('--- layar penjelasan ---');
const ch=M.caraHitung();
cek('menyebut sumber SBM', ch.indexOf('PMK 32/2025')>=0, true);
cek('memberi peringatan bukan angka SPJ', ch.indexOf('bukan angka SPJ')>=0, true);
cek('menyebut hotel/tiket tidak dihitung', ch.indexOf('tidak dihitung')>=0, true);
cek('beban tetap disebut poin', ch.indexOf('tetap poin')>=0, true);

console.log('--- admin tarif ---');
M.setPin('1234'); DB.jenis=[]; DB.anggota=[];
const ah=M.viewAdmin();
cek('ada bagian tarif transport', ah.indexOf('Tarif transport')>=0, true);
cek('hitungan terisi 2/3', ah.indexOf('(2/3)')>=0, true);
cek('yang kosong ditandai', ah.indexOf('belum diisi')>=0, true);
cek('tiap provinsi bisa diubah', (ah.match(/data-aksi="sbm-edit"/g)||[]).length, 3);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
