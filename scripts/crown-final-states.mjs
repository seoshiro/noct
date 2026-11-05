import {chromium} from '@playwright/test';
import fs from 'node:fs';
const base=process.env.NOCT_CROWN_URL||'http://127.0.0.1:5190/noct-crown-preview/';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});
for(const [name,width,height,query] of [['fallback-desktop',1440,1000,'lang=en&static=1'],['fallback-mobile',390,844,'lang=ru&static=1'],['fallback-small',320,667,'lang=ru&static=1'],['collection-desktop',1440,1000,'lang=en'],['collection-mobile',390,844,'lang=ru']]){
 await page.setViewportSize({width,height});await page.goto(base+'?'+query);await page.waitForTimeout(1200);
 if(name.startsWith('collection'))await page.locator('#collection').evaluate(e=>e.scrollIntoView({block:'start',behavior:'instant'}));
 await page.screenshot({path:`evidence/crown/${name}.jpg`,quality:94});
}
fs.writeFileSync('evidence/crown/final-states.json',JSON.stringify({base,errors,failed},null,2));await browser.close();
