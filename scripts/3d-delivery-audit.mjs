import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],failed=[];
p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push({url:r.url(),status:r.status()})});
const response=await p.goto('https://seoshiro.github.io/noct-3d-preview/review/');
if(response.status()!==200)throw Error('Review page is unavailable');
const recordings=[];
for(const v of await p.locator('video').all()){
 await v.evaluate(v=>new Promise((resolve,reject)=>{if(v.readyState>=1)return resolve();v.addEventListener('loadedmetadata',resolve,{once:true});v.addEventListener('error',reject,{once:true})}));
 recordings.push(await v.evaluate(v=>({url:v.currentSrc,width:v.videoWidth,height:v.videoHeight,duration:v.duration})));
 await v.evaluate(v=>v.play());await p.waitForTimeout(350);await v.evaluate(v=>v.pause());
}
await p.screenshot({path:'evidence/3d/review-page.jpg',quality:92,fullPage:true});
const report={review:response.url(),status:response.status(),recordings,errors,failed,checkedAt:new Date().toISOString()};
fs.writeFileSync('evidence/3d/delivery-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
if(errors.length||failed.length||recordings.length!==2||recordings.some(v=>v.duration<15))throw Error('Delivery audit failed');
await browser.close();
