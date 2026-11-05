import fs from 'node:fs';
import sharp from 'sharp';
fs.writeFileSync('public/media/fragments-master.png',Buffer.from(fs.readFileSync('fragments.b64','utf8'),'base64'));fs.unlinkSync('fragments.b64');
await sharp('public/media/fragments-master.png').resize(1800).webp({quality:86}).toFile('public/media/fragments.webp');
const meta=await sharp('public/media/fragments-master.png').metadata();
for(const [i,name] of ['wood','stone','linen'].entries())await sharp('public/media/fragments-master.png').extract({left:Math.floor(meta.width*i/3),top:0,width:Math.floor(meta.width/3),height:meta.height}).resize(700).webp({quality:87}).toFile('public/media/'+name+'.webp');
let app=fs.readFileSync('src/App.tsx','utf8');
app=app.replace(' <section className="collection"',` <section className="fragments" aria-labelledby="fragments-title"><div className="fragments-heading"><p className="eyebrow">{lang==='en'?'02 / THE SENSATIONS':'02 / ОЩУЩЕНИЯ'}</p><h2 id="fragments-title">{lang==='en'?'A language without words.':'Язык без слов.'}</h2></div><div className="fragments-grid">{scents.map((id,i)=><a key={id} href="#collection" onClick={()=>choose(id)} className={'fragment fragment-'+i}><img src={media(['wood.webp','stone.webp','linen.webp'][i])} loading="lazy" alt={catalog[id][lang].notes.join(' · ')}/><div><span className="eyebrow">0{i+1} / {catalog[id].name}</span><p>{catalog[id][lang].notes[0]}</p><span aria-hidden="true">↗</span></div></a>)}</div></section>\n <section className="collection"`);
fs.writeFileSync('src/App.tsx',app);
