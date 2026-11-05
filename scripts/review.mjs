import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
await page.goto('http://127.0.0.1:5174/noct/');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(1800);
await page.screenshot({path:'evidence/desktop.jpg',quality:92});
await page.waitForTimeout(4700);
const video=await page.locator('video').evaluate(v=>({width:v.videoWidth,height:v.videoHeight,duration:v.duration,paused:v.paused,currentTime:v.currentTime,quality:v.getVideoPlaybackQuality().toJSON?.()||{total:v.getVideoPlaybackQuality().totalVideoFrames,dropped:v.getVideoPlaybackQuality().droppedVideoFrames}}));
for(const section of ['story','collection','discovery']){await page.locator('#'+section).scrollIntoViewIfNeeded();await page.waitForTimeout(1100);await page.screenshot({path:`evidence/${section}-desktop.jpg`,quality:92})}
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5174/noct/');await page.waitForTimeout(1300);await page.screenshot({path:'evidence/mobile.jpg',quality:92});
for(const section of ['story','collection','discovery']){await page.locator('#'+section).scrollIntoViewIfNeeded();await page.waitForTimeout(1100);await page.screenshot({path:`evidence/${section}-mobile.jpg`,quality:92})}
await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await page.waitForTimeout(300);await page.getByRole('button',{name:'Switch to Russian'}).click();await page.waitForTimeout(1200);await page.screenshot({path:'evidence/mobile-ru.jpg',quality:92});
const report={video,errors,images:await page.locator('img').evaluateAll(imgs=>imgs.map(x=>({src:x.src,loaded:x.complete&&x.naturalWidth>0}))),horizontalOverflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
fs.writeFileSync('evidence/visual-review.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();
