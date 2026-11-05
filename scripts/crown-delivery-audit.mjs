import {chromium} from '@playwright/test';import fs from 'node:fs';
const base=process.env.NOCT_CROWN_URL||'https://seoshiro.github.io/noct-crown-preview/';
const b=await chromium.launch({channel:'chrome',headless:true}),p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});
const appResponse=await p.goto(base+'?lang=en');await p.waitForFunction(()=>window.__NOCT_CROWN__?.status==='ready');await p.evaluate(()=>document.fonts.ready);
const fonts=await p.evaluate(()=>[...document.fonts].map(f=>({family:f.family,status:f.status})));
for(const t of [.92,.18,.83,.31,.99,0]){await p.evaluate(t=>{const s=document.querySelector('.crown-story');scrollTo({top:s.offsetTop+(s.offsetHeight-innerHeight)*t,behavior:'instant'})},t);await p.waitForTimeout(30)}await p.waitForFunction(()=>window.__NOCT_CROWN__.progress<.0002);
const fastReturn=await p.evaluate(()=>({progress:window.__NOCT_CROWN__.progress,cap:window.__NOCT_CROWN__.capOpen,cloud:window.__NOCT_CROWN__.cloudCount,modelLoads:window.__NOCT_CROWN__.modelLoads,canvasCount:document.querySelectorAll('canvas').length,openDialogs:document.querySelectorAll('dialog[open]').length}));
const reviewResponse=await p.goto(base+'review/');if(reviewResponse.status()!==200)throw Error('Review unavailable');const recordings=[];
for(const v of await p.locator('video').all()){
 await v.evaluate(v=>new Promise((resolve,reject)=>{if(v.readyState>=1)return resolve();v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',reject,{once:true})}));
 const meta=await v.evaluate(v=>({url:v.currentSrc,width:v.videoWidth,height:v.videoHeight,duration:v.duration}));await v.evaluate(v=>v.play());await p.waitForTimeout(650);const currentTime=await v.evaluate(v=>{v.pause();return v.currentTime});recordings.push({...meta,played:currentTime>.2});
}
const images=[];for(const url of [...new Set(await p.locator('img').evaluateAll(xs=>xs.map(x=>x.src)))]){const r=await p.request.get(url);images.push({url,status:r.status(),contentType:r.headers()['content-type'],bytes:(await r.body()).length})}
await p.screenshot({path:'evidence/crown/review-page.jpg',quality:92,fullPage:true});
const report={checkedAt:new Date().toISOString(),app:appResponse.url(),appStatus:appResponse.status(),review:reviewResponse.url(),reviewStatus:reviewResponse.status(),fonts,fastReturn,recordings,images,errors,failed};fs.writeFileSync('evidence/crown/delivery-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await b.close();if(errors.length||failed.length||recordings.length!==2||recordings.some(v=>!v.played||v.duration<25)||images.some(i=>i.status!==200)||fonts.some(f=>f.status!=='loaded')||fastReturn.cloud||fastReturn.cap||fastReturn.openDialogs||fastReturn.modelLoads!==1||fastReturn.canvasCount!==1)throw Error('Delivery check failed');
