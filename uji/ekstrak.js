const fs=require('fs');
[['index.html','index.js'],['ios.html','ios.js']].forEach(([src,out])=>{
  const h=fs.readFileSync('/home/claude/relasi-media/'+src,'utf8');
  const m=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
  // blok terbesar = skrip utama
  const utama=m.sort((a,b)=>b.length-a.length)[0];
  fs.writeFileSync(out,utama);
  console.log(out,utama.length,'char dari',m.length,'blok');
});
