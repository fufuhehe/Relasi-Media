// Pengalih tampilan. Harus di head supaya tidak ada kedipan.
(function(){
  var DIRI="win";
  try{
    var mau=localStorage.getItem("keg_tampilan");
    if(mau!=="win"&&mau!=="ios") return;          // nilai aneh: abaikan
    if(mau===DIRI) return;                         // sudah benar: jangan pindah
    if(sessionStorage.getItem("keg_alih")==="1") return; // cegah putaran
    sessionStorage.setItem("keg_alih","1");
    location.replace("./ios.html");
  }catch(e){}
})();