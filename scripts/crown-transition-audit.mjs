import {chromium} from '@playwright/test';import fs from 'node:fs';
const base=process.env.NOCT_CROWN_URL||'http://127.0.0.1:5190/noct-crown-preview/';const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage();const results=[],issues=[];
for(const [width,height] of [[320,667],[390,844],[768,1024]])for(const lang of ['en','ru']){
 await p.setViewportSize({width,height});await p.goto(base+'?lang='+lang);await p.waitForFunction(()=>window.__NOCT_CROWN__?.status==='ready');
 for(const t of [.22,.25,.29,.305,.32,.35,.385]){
  await p.evaluate(t=>{const s=document.querySelector('.crown-story');scrollTo({top:s.offsetTop+(s.offsetHeight-innerHeight)*t,behavior:'instant'})},t);await p.waitForFunction(t=>Math.abs(window.__NOCT_CROWN__.progress-t)<.0002,t);
  const r=await p.evaluate(()=>{const el=document.querySelector('.story-opening'),rect=el.getBoundingClientRect(),body=window.__NOCT_CROWN__.bounds.body;return{opacity:Number(getComputedStyle(el).opacity),rect:rect.toJSON(),body}});
  results.push({width,height,lang,t,...r});if(r.opacity>.02&&r.rect.left<r.body.right+3&&r.rect.right>r.body.left&&r.rect.bottom>r.body.top&&r.rect.top<r.body.bottom)issues.push({width,height,lang,t,...r});
 }
 if(width===390&&lang==='ru')await p.screenshot({path:'evidence/crown/mobile-release-final.jpg',quality:94});
}
await b.close();fs.writeFileSync('evidence/crown/transition-audit.json',JSON.stringify({base,results,issues},null,2));console.log(JSON.stringify({states:results.length,issues}));if(issues.length)process.exitCode=1;
