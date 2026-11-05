import {chromium} from '@playwright/test';
import fs from 'node:fs';
import {nativeScroll} from './crown-browser-gestures.mjs';
const base=process.env.NOCT_CROWN_URL||'http://127.0.0.1:5190/noct-crown-preview/';
const browser=await chromium.launch({channel:'chrome',headless:true});fs.mkdirSync('evidence/crown/recordings',{recursive:true});const mobileOnly=process.argv.includes('--mobile-only');const results=mobileOnly?JSON.parse(fs.readFileSync('evidence/crown/recordings.json','utf8')).results.filter(r=>r.name==='desktop'):[];
for(const [name,width,height,mobile,lang] of [['desktop',1440,1000,false,'en'],['mobile',390,844,true,'ru']]){
 if(mobileOnly&&!mobile)continue;
 const context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:1,recordVideo:{dir:'evidence/crown/recordings',size:{width,height}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'?lang='+lang);await page.waitForFunction(()=>window.__NOCT_CROWN__?.status==='ready');await page.waitForTimeout(1600);
 await page.screenshot({path:`evidence/crown/public-${name}${mobile?'-ru':''}.jpg`,quality:95});
 const geometry=await page.evaluate(()=>{const s=document.querySelector('.crown-story');return{range:s.offsetHeight-innerHeight}}),cdp=await context.newCDPSession(page);
 await nativeScroll(page,cdp,geometry.range,mobile,mobile?650:490);await page.waitForTimeout(900);const end=await page.evaluate(()=>({progress:window.__NOCT_CROWN__.progress,cloud:window.__NOCT_CROWN__.cloudCount,cap:window.__NOCT_CROWN__.capOpen}));
 await nativeScroll(page,cdp,0,mobile,mobile?650:490);await page.waitForTimeout(900);const reverse=await page.evaluate(()=>window.__NOCT_CROWN__.progress);
 await page.locator('#collection').scrollIntoViewIfNeeded();await page.waitForTimeout(700);
 await page.getByRole('tab',{name:/RAIN/}).click();await page.waitForTimeout(400);await page.getByRole('tab',{name:/VEIL/}).click();await page.waitForTimeout(400);await page.getByRole('tab',{name:/EMBER/}).click();await page.locator('.crown-sizes button').filter({hasText:'100'}).click();await page.locator('.crown-add').click();await page.waitForTimeout(900);await page.getByRole('button',{name:mobile?'Увеличить количество ember-100':'Increase quantity ember-100',exact:true}).click();await page.waitForTimeout(700);
 await page.screenshot({path:`evidence/crown/cart-${name}.jpg`,quality:94});await page.locator('.checkout-demo').click();await page.waitForTimeout(1200);await page.locator('.drawer-close').click();await page.waitForTimeout(700);
 const metrics=await page.evaluate(()=>({renderer:window.__NOCT_CROWN__.renderer,modelLoads:window.__NOCT_CROWN__.modelLoads,canvasCount:document.querySelectorAll('canvas').length,language:document.documentElement.lang})),video=page.video();await page.close();const original=await video.path(),target=`evidence/crown/recordings/${name}-forward-back.webm`;await video.saveAs(target);await context.close();if(original!==target&&fs.existsSync(original))fs.unlinkSync(original);results.push({name,base,viewport:{width,height},mobileEmulation:mobile,lang,end,reverse,...metrics,video:target,errors});
}
await browser.close();fs.writeFileSync('evidence/crown/recordings.json',JSON.stringify({recordedAt:new Date().toISOString(),browser:'Chrome, headless, native browser wheel/touch synthesis',results},null,2));console.log(JSON.stringify(results,null,2));
