import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
const url='https://seoshiro.github.io/noct/';const response=await page.goto(url+'?lang=en');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(2000);await page.screenshot({path:'evidence/public-desktop.jpg',quality:94});
await page.waitForTimeout(4500);const film=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,ended:v.ended,paused:v.paused,currentTime:v.currentTime,frames:v.getVideoPlaybackQuality().totalVideoFrames,dropped:v.getVideoPlaybackQuality().droppedVideoFrames}));
for(const section of ['story','collection','discovery']){await page.locator('#'+section).scrollIntoViewIfNeeded();await page.waitForTimeout(300)}
const assets=await page.locator('img').evaluateAll(images=>images.map(x=>({src:x.src,loaded:x.complete&&x.naturalWidth>0})));
const portfolio=await page.locator('footer a[target]').getAttribute('href');
await page.setViewportSize({width:390,height:844});await page.goto(url+'?lang=ru');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1800);await page.screenshot({path:'evidence/public-mobile-ru.jpg',quality:94});
const russianCTA=await page.locator('.hero-copy .primary').boundingBox();
await page.setViewportSize({width:768,height:1024});await page.goto(url+'?lang=en');await page.waitForTimeout(1200);await page.screenshot({path:'evidence/public-tablet.jpg',quality:90});
const report={url,status:response.status(),film,assets,portfolio,russianCTA,errors};fs.writeFileSync('evidence/public-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
