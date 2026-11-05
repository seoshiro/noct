import {chromium} from '@playwright/test';
import fs from 'node:fs';
const base=process.env.NOCT_CROWN_URL||'http://127.0.0.1:5190/noct-crown-preview/';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1440,height:1000}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
const report=[];
for(const view of ['front','quarter','crown']){await p.goto(base+'?studio=1&view='+view);await p.waitForFunction(()=>window.__NOCT_CROWN__?.status==='ready');await p.waitForTimeout(400);await p.screenshot({path:`evidence/crown/browser-${view}.jpg`,quality:95});report.push(await p.evaluate(()=>window.__NOCT_CROWN__))}
await p.goto(base);await p.waitForFunction(()=>window.__NOCT_CROWN__?.status==='ready');await p.waitForTimeout(400);await p.screenshot({path:'evidence/crown/hero-desktop.jpg',quality:95});await p.setViewportSize({width:390,height:844});await p.goto(base+'?lang=ru');await p.waitForFunction(()=>window.__NOCT_CROWN__?.status==='ready');await p.waitForTimeout(400);await p.screenshot({path:'evidence/crown/hero-mobile-ru.jpg',quality:95});
fs.writeFileSync('evidence/crown/still-render-audit.json',JSON.stringify({base,report,errors},null,2));console.log(JSON.stringify({report,errors}));await b.close();
