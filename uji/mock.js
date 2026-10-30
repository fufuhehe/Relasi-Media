/* Data palsu yang bentuknya meniru punya Ibot, biar UI-nya bisa dilihat
   tanpa jaringan. Disuntik SEBELUM skrip utama jalan. */
(function(){
try{localStorage.setItem("keg_pin","1234");localStorage.setItem("keg_sandi","1234");}catch(e){}
var ORANG=["Astrid","Widi","Merlyn","Riri","Ika","Novie","Fahrul","Doni","Chika","Maul","Mirza"];
var TU=["Ragil","Adit"];
var anggota=[],i;
for(i=0;i<ORANG.length;i++) anggota.push({id:i+1,nama:ORANG[i],kategori:"tim",aktif:true,urutan:i+1});
for(i=0;i<TU.length;i++) anggota.push({id:100+i,nama:TU[i],kategori:"tu",aktif:true,urutan:i+1});
var JENIS=[
 {id:1,nama:"Rapat bodetabek",tier:"luar_pp",tingkat_beban:2,paket_meeting:true},
 {id:2,nama:"Monev FMB9",tier:"luar_pp",tingkat_beban:3,paket_meeting:false},
 {id:3,nama:"Diksi",tier:"dalam_kota",tingkat_beban:2,paket_meeting:true},
 {id:4,nama:"Produksi konten",tier:"luar_pp",tingkat_beban:3,paket_meeting:false},
 {id:5,nama:"Kunjungan jurnalistik",tier:"luar_inap",tingkat_beban:3,paket_meeting:false},
 {id:6,nama:"Media gathering",tier:"dalam_kota",tingkat_beban:1,paket_meeting:false},
 {id:7,nama:"Tapping FMB9",tier:"dalam_kota",tingkat_beban:2,paket_meeting:false}];
JENIS.forEach(function(j,n){j.aktif=true;j.urutan=n+1;});
var KOTA=[
 {kota:"Kota Bekasi",provinsi:"Jawa Barat",tarif:512000,urutan:1},
 {kota:"Kab. Bekasi",provinsi:"Jawa Barat",tarif:512000,urutan:2},
 {kota:"Kota Bogor",provinsi:"Jawa Barat",tarif:540000,urutan:3},
 {kota:"Kab. Bogor",provinsi:"Jawa Barat",tarif:540000,urutan:4},
 {kota:"Kota Depok",provinsi:"Jawa Barat",tarif:496000,urutan:5},
 {kota:"Kota Tangerang",provinsi:"Banten",tarif:516000,urutan:6},
 {kota:"Kota Tangerang Selatan",provinsi:"Banten",tarif:516000,urutan:7},
 {kota:"Kab. Tangerang",provinsi:"Banten",tarif:558000,urutan:8},
 {kota:"Kepulauan Seribu",provinsi:"DKI Jakarta",tarif:772000,urutan:9},
 {kota:"Karawang",provinsi:"Jawa Barat",tarif:0,urutan:20},
 {kota:"Bandung",provinsi:"Jawa Barat",tarif:0,urutan:21},
 {kota:"Serang",provinsi:"Banten",tarif:0,urutan:22}];
var PROV=[["Aceh",410000,160000,123000],["Sumatera Utara",430000,170000,278000],
 ["Banten",370000,150000,300000],["Jawa Barat",430000,170000,180000],
 ["DKI Jakarta",530000,210000,250000],["Jawa Tengah",370000,150000,105000],
 ["DI Yogyakarta",420000,170000,258000],["Jawa Timur",410000,160000,225000],
 ["Bali",480000,190000,219000],["Nusa Tenggara Barat",440000,180000,224000],
 ["Nusa Tenggara Timur",430000,170000,105000],["Sulawesi Selatan",430000,170000,181000],
 ["Papua",580000,230000,462000],["Papua Tengah",580000,230000,0]];
var sbm=PROV.map(function(p,n){return {provinsi:p[0],uang_harian_luar:p[1],uang_harian_dalam:p[2],
  transport_dalam:p[0]==="DKI Jakarta"?170000:0,transport_luar:0,taksi:p[3],urutan:n+1};});
var JUDUL=["AGS November","CKG","Karhutla","Garuda TV","Content Plan Oktober FMB 9 x GNFI",
 "Program PU","Socex Capaian 2 Tahun","Sekolah Rakyat","Revitalisasi Pendidikan",
 "Digitalisasi Pendidikan","Merdeka Run 2026","PP Tunas"];
var LOK=["Aston Bintaro","Atedoz Bogor","Amanaia Satrio","Santika Premier Bintaro",
 "KemenPU jakarta","Savero Hotel Depok","Studio Atedoz Cibinong","Royal Hotel Bogor",
 "PUSPA KOMDIGI","SMP Negeri 1 Tabanan","Hotel Aryaduta","Kantor The Jakarta Post"];
var kegiatan=[],penugasan=[],foto=[],id=0;
for(var b=9;b>=1;b--){
  var n=b===10?11:(b%3===0?6:9);
  for(var x=0;x<n;x++){
    id++;
    var j=JENIS[id%JENIS.length];
    var pakaiKota=(id%3!==0);
    var kt=KOTA[id%KOTA.length];
    var hari=j.tier==="luar_inap"?3:((id%7===0)?2:1);
    kegiatan.push({id:id,jenis_id:j.id,judul:JUDUL[id%JUDUL.length],
      tanggal:"2026-"+String(b).padStart(2,"0")+"-"+String((id%27)+1).padStart(2,"0"),
      jumlah_hari:hari,lokasi:LOK[id%LOK.length],tier:j.tier,tingkat_beban:j.tingkat_beban,
      ketua_id:(id%ORANG.length)+1,catatan:id%9===0?"Dokumentasi menyusul dari tim lapangan.":"",
      provinsi:pakaiKota?kt.provinsi:PROV[id%PROV.length][0],
      kota:pakaiKota?kt.kota:null,
      hari_meeting:j.paket_meeting?1:0,dibuat:"2026-"+String(b).padStart(2,"0")+"-01"});
    var jml=3+(id%9);
    for(var a=0;a<jml;a++) penugasan.push({kegiatan_id:id,anggota_id:((id+a)%ORANG.length)+1});
    if(id%4!==0) penugasan.push({kegiatan_id:id,anggota_id:100+(id%2)});
    if(id%3!==0){
      foto.push({id:id*10,kegiatan_id:id,path:id+"/a.jpg",keterangan:"",dibuat:"1",sampul:true});
      if(id%5===0) foto.push({id:id*10+1,kegiatan_id:id,path:id+"/b.jpg",keterangan:"",dibuat:"2",sampul:false});
    }
  }
}
kegiatan.push({id:999,jenis_id:2,judul:"Belum dijadwalkan",tanggal:null,jumlah_hari:1,
  lokasi:"",tier:"luar_pp",tingkat_beban:2,ketua_id:2,catatan:"",provinsi:"Jawa Barat",
  kota:"Kota Bogor",hari_meeting:0,dibuat:"2026-10-29"});
penugasan.push({kegiatan_id:999,anggota_id:3});
var DATA={anggota:anggota,jenis:JENIS,kegiatan:kegiatan,penugasan:penugasan,foto:foto,
  sbm:sbm,kota:KOTA,config:{nama_tim:"Kerjaan Relasi Media",provinsi_basis:"DKI Jakarta",
  faktor_transport:"2",faktor_ketua:"1.2"}};
var asli=window.fetch;
window.fetch=function(url,opt){
  url=String(url);
  function ok(v){return Promise.resolve({ok:true,status:200,
    json:function(){return Promise.resolve(v);},text:function(){return Promise.resolve(JSON.stringify(v));}});}
  if(url.indexOf("/rpc/keg_data")>=0) return ok(DATA);
  if(url.indexOf("/rpc/keg_cek_pin")>=0) return ok(true);
  if(url.indexOf("/object/sign/bukti")>=0){
    var body={};try{body=JSON.parse(opt.body||"{}");}catch(e){}
    if(body.paths) return ok(body.paths.map(function(p){
      return {path:p,signedURL:"/foto.jpg",error:null};}));
    return ok({signedURL:"/foto.jpg"});}
  if(url.indexOf("/functions/v1/bukti-upload")>=0) return ok({urls:{}});
  return ok([]);};
})();
