const fs=require('fs');
const FILE=process.argv[2]||'index.js';
const DIRI=FILE.indexOf('ios')>=0?'ios':'win';
let src=fs.readFileSync(FILE,'utf8');
let gagal=0;
function cek(n,d,h){const a=JSON.stringify(d),b=JSON.stringify(h);const ok=a===b;if(!ok)gagal++;
  console.log((ok?'  ok  ':'GAGAL ')+n+(ok?'':'\n        dapat: '+a+'\n        harus: '+b));}

global.fetch=()=>Promise.resolve({ok:true,json:()=>Promise.resolve([]),text:()=>Promise.resolve("[]")});
global.document={querySelector:()=>({textContent:'',innerHTML:'',value:''}),querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},getAttribute(){return null}}),
  addEventListener(){},documentElement:{getAttribute:()=>null,setAttribute(){}}};
global.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.sessionStorage={getItem:()=>null,setItem(){},removeItem(){}};
global.navigator={}; global.window={matchMedia:()=>({matches:false})};
src=src.replace(/\(function\(\)\{\n  try\{[\s\S]*$/,'');
src+="\nmodule.exports={viewAdmin,DB,setPin:p=>{PIN=p},"
 +"getBuka:()=>ADMIN_BUKA,setBuka:b=>{ADMIN_BUKA=b}};\n";
fs.writeFileSync('g_'+FILE,src);
const M=require('./g_'+FILE);
M.DB.config={nama_tim:'Tim'};
M.DB.jenis=[{id:1,nama:'Monev',tier:'dalam_kota',tingkat_beban:2,aktif:true},
            {id:2,nama:'Rakor',tier:'luar_pp',tingkat_beban:3,aktif:true}];
M.DB.anggota=[{id:1,nama:'Astrid',kategori:'tim',aktif:true},
              {id:2,nama:'Widi',kategori:'tim',aktif:true},
              {id:3,nama:'Ika',kategori:'tu',aktif:true}];

console.log('--- label jadul / modern ---');
M.setPin('1234');
let h=M.viewAdmin();
cek('tombol "Jadul" ada', h.indexOf('>Jadul<')>=0, true);
cek('tombol "Modern" ada', h.indexOf('>Modern<')>=0, true);
cek('tidak ada lagi "Windows 98"', h.indexOf('Windows 98')>=0, false);
cek('tidak ada lagi "iOS"', /<button[^>]*>iOS</.test(h), false);
cek('nilai tersimpan tetap win/ios',
  [/data-v="win"/.test(h), /data-v="ios"/.test(h)], [true,true]);
const tandai=h.match(/data-v="(win|ios)" class="tekan"/);
cek('yang sedang dipakai masih ditandai', tandai&&tandai[1], DIRI);

console.log('--- panel admin jadi accordion ---');
const bagian=(h.match(/data-adm="([a-z]+)"/g)||[]);
cek('5 bagian jadi accordion', bagian.length, 5);
cek('bagiannya benar', bagian,
  ['data-adm="tampilan"','data-adm="jenis"','data-adm="sbm"','data-adm="orang"','data-adm="skor"']);
cek('semua tertutup secara bawaan', /data-adm="[a-z]+" open>/.test(h), false);
cek('jumlah kegiatan di judul', /Daftar kegiatan[^<]*\(2\)|\(2\)/.test(h), true);
cek('jumlah orang di judul', /\(3\)/.test(h), true);
cek('Tampilan tanpa angka', /Tampilan[^(]*\(/.test(h.split('data-adm="jenis"')[0]), false);

console.log('--- status buka bertahan ---');
M.setBuka({orang:true});
h=M.viewAdmin();
cek('Orang terbuka', /data-adm="orang" open>/.test(h), true);
cek('yang lain tetap tertutup', /data-adm="jenis" open>/.test(h), false);
M.setBuka({});

console.log('--- isi tiap bagian tetap utuh ---');
h=M.viewAdmin();
cek('tombol tambah kegiatan ada', h.indexOf('jenis-baru')>=0, true);
cek('tombol tambah orang ada', h.indexOf('ang-baru')>=0, true);
cek('daftar jenis terender', (h.match(/data-aksi="jenis-edit"/g)||[]).length, 2);
cek('daftar orang terender', (h.match(/data-aksi="ang-edit"/g)||[]).length, 3);
cek("field pengaturan skor ada", (h.match(/data-cfg="/g)||[]).length, 5);
cek('knob poin_luar_inap sudah dibuang', h.indexOf('poin_luar_inap')>=0, false);
cek('ada field sandi tim', h.indexOf('data-cfg="sandi"')>=0, true);
cek('field sandi dikosongkan, bukan menampilkan yang lama',
  /data-cfg="sandi"[^>]*value=""/.test(h), true);
cek('tombol simpan pengaturan ada', h.indexOf('simpan-cfg')>=0, true);
cek('tombol keluar admin ada', h.indexOf('data-aksi="logout"')>=0, true);

console.log('--- belum login ---');
M.setPin(null);
h=M.viewAdmin();
cek('tidak ada accordion', h.indexOf('data-adm')>=0, false);
cek('form PIN muncul', h.indexOf('inpPin')>=0, true);

console.log(gagal?'\n>>> '+gagal+' TES GAGAL':'\n>>> SEMUA TES LULUS');
process.exit(gagal?1:0);
