import {chromium} from '@playwright/test';import fs from 'node:fs';import sharp from 'sharp';
const b=await chromium.launch({channel:'chrome',headless:true});const p=await b.newPage({viewport:{width:1200,height:1500},deviceScaleFactor:1});const result=[];
for(const [id,view] of [['ember','front'],['rain','reverse-quarter'],['veil','quarter']]){
 await p.goto(`http://127.0.0.1:5190/noct-crown-preview/?studio=1&view=${view}&cutout=1`);await p.waitForFunction(()=>window.__NOCT_CROWN__?.status==='ready');await p.waitForTimeout(150);
 const data=await p.locator('canvas').evaluate(c=>c.toDataURL('image/png'));const png=Buffer.from(data.split(',')[1],'base64');fs.writeFileSync(`art/crown/render-${id}.png`,png);
 await sharp(png).trim().extend({top:30,bottom:30,left:30,right:30,background:{r:0,g:0,b:0,alpha:0}}).resize({height:1200}).webp({quality:90}).toFile(`public/media/crown-product-${id}.webp`);
 result.push({id,view,pngBytes:png.length,webpBytes:fs.statSync(`public/media/crown-product-${id}.webp`).size});
}
console.log(JSON.stringify(result));await b.close();
