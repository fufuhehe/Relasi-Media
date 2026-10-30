/* t15 — aturan dari Ibot (30 Okt 2026), diadu ke Daftar Nominatif SPD 2026.
   1. setiap kegiatan dapat transport PP sekali, berapa pun harinya
   2. Bodetabek ikut tabel PMK 32/2025 hal. 68 (one way x 2)
   3. Karawang & Bandung at-cost = 0
   4. hari paket meeting tidak dapat uang harian
   5. 3 hari meeting di hari kedua -> uang harian 2 hari; meeting 3 hari -> 0 */
const fs=require('fs');
const FILE=process.argv[2]||'index.js';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const ok=JSON.stringify(d)===JSON.stringify(h);if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'   dapat '+JSON.stringify(d)+' harus '+JSON.stringify(h)));}
global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([])});
global.document={querySelector:()=>({textContent:'',innerHTML:'',value:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  body:{appendChild(){},removeChild(){}},addEventListener(){},
  documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={rinciJalan,skorJalan,kotaKeg,provKeg,transportLuar,tarif,opsiTujuan,viewAdmin,viewCatat,uangRingkas,bawaanHariMeeting,DB,setPin:p=>{PIN=p}};\n";
fs.writeFileSync('p_'+FILE,src);
const M=require('./p_'+FILE), {DB}=M;

DB.config={provinsi_basis:'DKI Jakarta',faktor_transport:'2'};
DB.sbm=[
 {provinsi:'DKI Jakarta',        uang_harian_luar:530000,uang_harian_dalam:210000,transport_dalam:170000,transport_luar:0,taksi:250000,urutan:13},
 {provinsi:'Jawa Barat',         uang_harian_luar:430000,uang_harian_dalam:170000,transport_dalam:0,transport_luar:0,taksi:180000,urutan:12},
 {provinsi:'Banten',             uang_harian_luar:370000,uang_harian_dalam:150000,transport_dalam:0,transport_luar:0,taksi:300000,urutan:11},
 {provinsi:'Bali',               uang_harian_luar:480000,uang_harian_dalam:190000,transport_dalam:0,transport_luar:0,taksi:219000,urutan:17},
 {provinsi:'Nusa Tenggara Timur',uang_harian_luar:430000,uang_harian_dalam:170000,transport_dalam:0,transport_luar:0,taksi:105000,urutan:19},
 {provinsi:'Jawa Timur',         uang_harian_luar:410000,uang_harian_dalam:170000,transport_dalam:0,transport_luar:0,taksi:225000,urutan:16}];
/* PMK 32/2025 hal. 68: one way x 2 */
DB.kota=[
 {kota:'Kota Bekasi',           provinsi:'Jawa Barat',tarif:512000,urutan:1},
 {kota:'Kab. Bekasi',           provinsi:'Jawa Barat',tarif:512000,urutan:2},
 {kota:'Kota Bogor',            provinsi:'Jawa Barat',tarif:540000,urutan:3},
 {kota:'Kab. Bogor',            provinsi:'Jawa Barat',tarif:540000,urutan:4},
 {kota:'Kota Depok',            provinsi:'Jawa Barat',tarif:496000,urutan:5},
 {kota:'Kota Tangerang',        provinsi:'Banten',    tarif:516000,urutan:6},
 {kota:'Kota Tangerang Selatan',provinsi:'Banten',    tarif:516000,urutan:7},
 {kota:'Kab. Tangerang',        provinsi:'Banten',    tarif:558000,urutan:8},
 {kota:'Kepulauan Seribu',      provinsi:'DKI Jakarta',tarif:772000,urutan:9},
 {kota:'Karawang',              provinsi:'Jawa Barat',tarif:0,urutan:20},
 {kota:'Bandung',               provinsi:'Jawa Barat',tarif:0,urutan:21},
 {kota:'Serang',                provinsi:'Banten',    tarif:0,urutan:22}];

const K=o=>Object.assign({tier:'luar_pp',jumlah_hari:1,hari_meeting:0,provinsi:null,
                          kota:null,lokasi:'',tingkat_beban:2},o);
function spj(label,keg,transport,uh){
  const r=M.rinciJalan(K(keg));
  cek(label+' — transport', r.transport, transport);
  cek(label+' — uang harian', r.uh, uh);
  cek(label+' — jumlah', r.total, transport+uh);}

console.log('--- catatan yang bikin bug kemarin ---');
/* lokasi "Aston Bintaro" tidak memuat nama kota. Dulu jatuh ke rumus
   provinsi Banten -> 1.470.000. Sekarang tujuannya dipilih. */
spj('28/10 Aston Bintaro, rapat',
  {kota:'Kota Tangerang Selatan',lokasi:'Aston Bintaro',hari_meeting:1},516000,0);
cek('venue tanpa nama kota tidak bikin salah lagi',
  M.skorJalan(K({kota:'Kota Tangerang Selatan',lokasi:'Aston Bintaro',hari_meeting:1}))===1470000, false);
cek('provinsi uang harian ikut tujuan',
  M.provKeg(K({kota:'Kota Tangerang Selatan',provinsi:null})), 'Banten');

console.log('--- Bodetabek ikut tabel PMK hal. 68 ---');
spj('Kab. Bogor, produksi konten', {kota:'Kab. Bogor'},540000,430000);
spj('Kota Depok, rapat',           {kota:'Kota Depok',hari_meeting:1},496000,0);
spj('Kab. Bekasi 2 hari monitoring',{kota:'Kab. Bekasi',jumlah_hari:2},512000,860000);
spj('Kota Bogor, rapat',           {kota:'Kota Bogor',hari_meeting:1},540000,0);
cek('Kab. Tangerang 279rb x2',     M.rinciJalan(K({kota:'Kab. Tangerang'})).transport, 558000);
cek('Kepulauan Seribu 386rb x2',   M.rinciJalan(K({kota:'Kepulauan Seribu'})).transport, 772000);

console.log('--- Karawang & Bandung at-cost ---');
spj('Bandung 1 hari',  {kota:'Bandung'},0,430000);
spj('Karawang 2 hari', {kota:'Karawang',jumlah_hari:2},0,860000);
cek('at-cost tidak ditandai belum lengkap',
  M.rinciJalan(K({kota:'Bandung'})).lengkap, true);
cek('at-cost tidak jatuh ke rumus provinsi',
  M.rinciJalan(K({kota:'Bandung'})).transport===(250000+180000)*2, false);

console.log('--- transport sekali per perjalanan, berapa pun harinya ---');
[1,2,3,5,10].forEach(function(n){
  cek('Kab. Bogor '+n+' hari: tetap 540rb',
    M.rinciJalan(K({kota:'Kab. Bogor',jumlah_hari:n})).transport, 540000);});
cek('Jakarta dalam kota 3 hari: tetap 170rb',
  M.rinciJalan(K({tier:'dalam_kota',provinsi:'DKI Jakarta',jumlah_hari:3})).transport, 170000);
cek('Bali nginap 5 hari: tetap 938rb',
  M.rinciJalan(K({tier:'luar_inap',provinsi:'Bali',jumlah_hari:5})).transport, 938000);

console.log('--- aturan hari meeting ---');
cek('3 hari, meeting hari kedua -> uang harian 2 hari',
  M.rinciJalan(K({tier:'luar_inap',provinsi:'Bali',jumlah_hari:3,hari_meeting:1})).uh, 960000);
cek('3 hari, meeting 3 hari -> uang harian 0',
  M.rinciJalan(K({tier:'luar_inap',provinsi:'Bali',jumlah_hari:3,hari_meeting:3})).uh, 0);
cek('1 hari paket meeting -> 0, bukan 130rb',
  M.rinciJalan(K({kota:'Kota Depok',hari_meeting:1})).uh, 0);
cek('nginap 1 hari paket meeting -> tetap 0',
  M.rinciJalan(K({tier:'luar_inap',provinsi:'Bali',jumlah_hari:1,hari_meeting:1})).uh, 0);
cek('hari meeting dibatasi jumlah hari',
  M.rinciJalan(K({provinsi:'Jawa Barat',jumlah_hari:2,hari_meeting:9})).uh, 0);

console.log('--- tujuan di provinsi sendiri = dalam kota ---');
/* Rumus jalur 3 menganggap berangkat dari LUAR provinsi. Dipakai untuk
   DKI->DKI hasilnya (250+250)x2 = Rp 1jt, padahal homebase-nya Jakarta
   jadi kenyataannya cuma transport lokal 170rb. */
cek('DKI ditandai luar_pp: transport tetap 170rb, bukan 1 juta',
  M.rinciJalan(K({tier:'luar_pp',provinsi:'DKI Jakarta'})).transport, 170000);
cek('DKI ditandai luar_inap: tetap 170rb',
  M.rinciJalan(K({tier:'luar_inap',provinsi:'DKI Jakarta',jumlah_hari:2})).transport, 170000);
cek('uang hariannya ikut tarif dalam kota',
  M.rinciJalan(K({tier:'luar_pp',provinsi:'DKI Jakarta'})).uh, 210000);
cek('asalnya ditulis jelas',
  M.rinciJalan(K({tier:'luar_pp',provinsi:'DKI Jakarta'})).asal, 'transport dalam kota DKI Jakarta');
cek('tidak ditandai belum lengkap',
  M.rinciJalan(K({tier:'luar_pp',provinsi:'DKI Jakarta'})).lengkap, true);
cek('provinsi LAIN tidak ikut kena aturan ini',
  M.rinciJalan(K({tier:'luar_pp',provinsi:'Bali'})).transport, 938000);
cek('tujuan khusus tetap menang walau provinsinya DKI',
  M.rinciJalan(K({tier:'luar_pp',provinsi:'DKI Jakarta',kota:'Kepulauan Seribu'})).transport, 772000);
cek('kalau basis pindah, aturannya ikut pindah', (function(){
  DB.config.provinsi_basis='Bali';
  var a=M.rinciJalan(K({tier:'luar_pp',provinsi:'Bali'})).transport;
  var b=M.rinciJalan(K({tier:'luar_pp',provinsi:'DKI Jakarta'})).transport;
  DB.config.provinsi_basis='DKI Jakarta';
  return [a,b];})(), [0,938000]);

console.log('--- luar provinsi tetap (taksi asal + tujuan) x 2 ---');
spj('Bali 3 hari',  {tier:'luar_inap',provinsi:'Bali',jumlah_hari:3},938000,1440000);
spj('NTT 3 hari',   {tier:'luar_inap',provinsi:'Nusa Tenggara Timur',jumlah_hari:3},710000,1290000);
spj('Jatim 3 hari', {tier:'luar_inap',provinsi:'Jawa Timur',jumlah_hari:3},950000,1230000);

console.log('--- Jakarta ---');
spj('rapat di Jakarta', {tier:'dalam_kota',provinsi:'DKI Jakarta',hari_meeting:1},170000,0);
spj('bukan rapat di Jakarta', {tier:'dalam_kota',provinsi:'DKI Jakarta'},170000,210000);

console.log('--- kasus batas ---');
cek('tanpa tujuan & tanpa provinsi: pakai basis',
  M.provKeg(K({})), 'DKI Jakarta');
cek('tujuan tidak dikenal: diabaikan, balik ke provinsi',
  M.rinciJalan(K({kota:'Kota Antah Berantah',provinsi:'Jawa Barat'})).transport, (250000+180000)*2);
cek('provinsi tak dikenal tidak meledak',
  M.rinciJalan(K({provinsi:'Wakanda'})).tarifAda, false);
cek('asal angka selalu ditulis',
  M.rinciJalan(K({kota:'Kota Depok'})).asal, 'tarif Kota Depok');
cek('asal at-cost jelas',
  M.rinciJalan(K({kota:'Bandung'})).asal.indexOf('at-cost')>=0, true);
cek('asal hitungan provinsi jelas',
  M.rinciJalan(K({provinsi:'Bali'})).asal, 'hitungan provinsi Bali');

console.log('--- dropdown tujuan ---');
var o=M.opsiTujuan('Kota Depok','');
cek('kota dan provinsi sama-sama ada', (o.match(/<optgroup/g)||[]).length, 2);
cek('tujuan terpilih tercentang', /value="k:Kota Depok" selected/.test(o), true);
cek('tidak ada provinsi ikut tercentang', (o.match(/ selected/g)||[]).length, 1);
var o2=M.opsiTujuan('','Bali');
cek('tanpa kota: provinsi yang tercentang', /value="p:Bali" selected/.test(o2), true);
cek('at-cost ditulis di dropdown', o.indexOf('at-cost')>=0, true);

console.log('--- default hari paket meeting ---');
/* Jenis yang ditandai paket meeting mengisi 1 hari secara bawaan, bukan
   seluruh durasi: biasanya cuma salah satu harinya yang paket. */
DB.jenis=[{id:1,nama:'Rapat bodetabek',tier:'luar_pp',tingkat_beban:2,aktif:true,paket_meeting:true},
          {id:2,nama:'Produksi konten',tier:'luar_pp',tingkat_beban:2,aktif:true,paket_meeting:false}];
var jm=DB.jenis[0], jb=DB.jenis[1];
cek('jenis paket meeting, 3 hari -> 1', M.bawaanHariMeeting(jm,3), 1);
cek('jenis paket meeting, 1 hari -> 1', M.bawaanHariMeeting(jm,1), 1);
cek('jenis paket meeting, 10 hari -> tetap 1', M.bawaanHariMeeting(jm,10), 1);
cek('jenis biasa -> 0', M.bawaanHariMeeting(jb,3), 0);
cek('tanpa jenis -> 0', M.bawaanHariMeeting(null,3), 0);
cek('hari aneh tidak bikin minus', M.bawaanHariMeeting(jm,0), 1);
cek('label form bilang paket meeting',
  /Berapa hari paket meeting/.test(require('fs').readFileSync(FILE,'utf8')), true);
cek('petunjuk tetap menyebut narasumber',
  /narasumber/.test(require('fs').readFileSync(FILE,'utf8')), true);

console.log('--- rupiah di kartu daftar ---');
cek('Bodetabek: angka benar, ditandai per orang',
  M.uangRingkas(K({kota:'Kota Depok',hari_meeting:1})),
  '<b class="duit">Rp 496rb/org</b>');
cek('luar provinsi ikut uang harian',
  M.uangRingkas(K({tier:'luar_inap',provinsi:'Bali',jumlah_hari:3})),
  '<b class="duit">Rp 2,4jt/org</b>');
cek('at-cost tetap dihitung lengkap',
  M.uangRingkas(K({kota:'Bandung'})), '<b class="duit">Rp 430rb/org</b>');
cek('tarif belum diisi ditandai tanda tanya',
  /\?<\/b>$/.test(M.uangRingkas(K({provinsi:'Papua Tengah'}))), true);
cek('provinsi tak dikenal: Rp ?',
  M.uangRingkas(K({provinsi:'Wakanda'})).indexOf('Rp ?')>=0, true);

console.log('--- panel admin ---');
M.setPin('1234'); DB.anggota=[];
const h=M.viewAdmin();
cek('daftar tujuan tampil', (h.match(/data-aksi="kota-edit"/g)||[]).length, 12);
cek('pilihan paket meeting ada di master jenis',
  require('fs').readFileSync(FILE,'utf8').indexOf('ditanggung panitia (paket meeting / jadi narasumber)')>=0, true);
cek('knob uang saku fullboard sudah dibuang', h.indexOf('uang_saku_fullboard')>=0, false);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
