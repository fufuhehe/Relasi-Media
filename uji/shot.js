const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const varian=process.argv[2]||'jadul';
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,
    isMobile:true,hasTouch:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'});
  const p=await ctx.newPage();
  const salah=[];
  p.on('pageerror',e=>salah.push('PAGEERROR: '+e.message));
  p.on('console',m=>{if(m.type()==='error')salah.push('CONSOLE: '+m.text());});
  await p.goto('file://'+__dirname+'/'+varian+'.html');
  await p.waitForTimeout(1200);
  async function jepret(nama){ await p.screenshot({path:varian+'-'+nama+'.png'}); }
  await jepret('1-daftar');
  // buka detail kartu pertama
  const kartu=await p.$('details[open] [data-aksi="detail"]');
  if(kartu){ await kartu.click(); await p.waitForTimeout(600); await jepret('2-detail'); 
    // scroll ke bawah di modal
    await p.evaluate(()=>{const e=document.querySelector('.tutup')||document.querySelector('.modal');
      if(e) e.scrollTop=e.scrollHeight;});
    await p.waitForTimeout(300); await jepret('3-detail-bawah');
    const tutup=await p.$('[data-aksi="tutup"]'); if(tutup) await tutup.click();
    await p.waitForTimeout(400);}
  // form catat
  const catat=await p.$('[data-aksi="baru"]');
  if(catat){ await catat.click(); await p.waitForTimeout(600); await jepret('4-form'); 
    const bt=await p.$('[data-aksi="batal"]'); if(bt) await bt.click(); await p.waitForTimeout(400);}
  // tab Tim
  const tim=await p.$('[data-aksi="tab"][data-v="orang"]');
  if(tim){ await tim.click(); await p.waitForTimeout(700); await jepret('5-tim'); }
  // tab Admin
  const adm=await p.$('[data-aksi="tab"][data-v="admin"]');
  if(adm){ await adm.click(); await p.waitForTimeout(700); await jepret('6-admin'); }
  console.log(varian+': '+(salah.length?salah.join('\n'):'tidak ada error js'));
  await b.close();
})();
