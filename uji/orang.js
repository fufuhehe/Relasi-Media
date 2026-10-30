const {chromium}=require('playwright');
(async()=>{
  const b=await chromium.launch();
  const v=process.argv[2]||'jadul';
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  const p=await ctx.newPage();
  const salah=[];
  p.on('pageerror',e=>salah.push('PAGEERROR: '+e.message));
  await p.goto('file://'+__dirname+'/'+v+'.html');
  await p.waitForTimeout(1000);
  await (await p.$('[data-aksi="tab"][data-v="orang"]')).click();
  await p.waitForTimeout(700);
  const nm=await p.$('[data-aksi="lihat"]');
  if(nm){ await nm.click(); await p.waitForTimeout(600); }
  await p.screenshot({path:v+'-7-orang.png'});
  console.log(v+': '+(salah.length?salah.join('\n'):'tidak ada error js'));
  await b.close();
})();
