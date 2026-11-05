import {chromium} from '@playwright/test';
import fs from 'node:fs';
import {nativeScroll} from './crown-browser-gestures.mjs';
const base=process.env.NOCT_CROWN_URL||'http://127.0.0.1:5190/noct-crown-preview/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const mobileOnly=process.argv.includes('--mobile-only');const results=mobileOnly?JSON.parse(fs.readFileSync('evidence/crown/performance.json','utf8')).results.filter(r=>r.name==='desktop'):[];
const summarize=values=>{const a=values.slice().sort((a,b)=>a-b),q=p=>a[Math.min(a.length-1,Math.floor(a.length*p))];return{samples:a.length,medianMs:q(.5),p95Ms:q(.95),maxMs:a.at(-1),over33ms:a.filter(x=>x>33.4).length,over50ms:a.filter(x=>x>50).length}};
for(const [name,width,height,mobile] of [['desktop',1440,1000,false],['mobile-emulation',390,844,true]]){
 if(mobileOnly&&!mobile)continue;
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:mobile?2:1,isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'?lang=en');await page.waitForFunction(()=>window.__NOCT_CROWN__?.status==='ready');
 const geometry=await page.evaluate(()=>{const s=document.querySelector('.crown-story');return{start:s.offsetTop,range:s.offsetHeight-innerHeight}});
 for(const p of [.36,.5,0]){await page.evaluate(({geometry,p})=>scrollTo({top:geometry.start+geometry.range*p,behavior:'instant'}),{geometry,p});await page.waitForFunction(p=>Math.abs(window.__NOCT_CROWN__.progress-p)<.0002,p)}
 await page.waitForTimeout(400);await page.evaluate(()=>{window.__NOCT_CROWN__.frameTimes=[];window.__NOCT_CROWN__.renderTimes=[]});
 const cdp=await context.newCDPSession(page);
 await nativeScroll(page,cdp,geometry.start+geometry.range,mobile,650);await page.waitForTimeout(450);
 const end=await page.evaluate(()=>({p:window.__NOCT_CROWN__.progress,cloud:window.__NOCT_CROWN__.cloudCount,cap:window.__NOCT_CROWN__.capOpen,frames:window.__NOCT_CROWN__.frames}));
 await page.waitForTimeout(450);const idleFrames=await page.evaluate(()=>window.__NOCT_CROWN__.frames);
 await nativeScroll(page,cdp,geometry.start,mobile,650);await page.waitForTimeout(450);
 const data=await page.evaluate(()=>({metrics:window.__NOCT_CROWN__,environment:{userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,deviceMemory:navigator.deviceMemory,devicePixelRatio,canvas:{width:document.querySelector('canvas').width,height:document.querySelector('canvas').height}}}));
 results.push({name,viewport:{width,height},mobileEmulation:mobile,throttling:'none',recordVideo:false,shaderWarmup:true,browser:browser.version(),...data.environment,renderer:data.metrics.renderer,triangles:data.metrics.triangles,calls:data.metrics.calls,modelLoads:data.metrics.modelLoads,end,idleStopped:idleFrames===end.frames,reverseProgress:data.metrics.progress,raf:summarize(data.metrics.frameTimes),renderSubmission:summarize(data.metrics.renderTimes),raw:{frameTimes:data.metrics.frameTimes,renderTimes:data.metrics.renderTimes},errors});
 await context.close();
}
await browser.close();fs.writeFileSync('evidence/crown/performance.json',JSON.stringify({base,measuredAt:new Date().toISOString(),conditions:'Local Chrome headless, hardware WebGL; native CDP wheel/touch scroll; warm shaders; no CPU/network throttling; one page, no recording during timing. Mobile is viewport/touch emulation on the same computer, not a phone.',results},null,2));
console.log(JSON.stringify(results.map(({raw,...r})=>r),null,2));
