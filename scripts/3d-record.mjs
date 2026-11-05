import {chromium} from '@playwright/test';
import fs from 'node:fs';
const base=process.env.NOCT_3D_URL||'http://127.0.0.1:5180/noct-3d-preview/';
const browser=await chromium.launch({channel:'chrome',headless:true});
fs.mkdirSync('evidence/3d/recordings',{recursive:true});
const results={base,browser:browser.version(),conditions:'Headless Chrome; no CPU/network throttling; warmed GLB/shaders. Mobile is touch/viewport emulation on the same laptop, not a physical phone.',runs:[]};
const percentile=(a,q)=>a.length?[...a].sort((x,y)=>x-y)[Math.floor((a.length-1)*q)]:null;
async function record(mobile){
 const viewport=mobile?{width:390,height:844}:{width:1440,height:1000};
 const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1,recordVideo:{dir:'evidence/3d/recordings',size:viewport}});
 await ctx.addInitScript(()=>{addEventListener('DOMContentLoaded',()=>{const cursor=document.createElement('div');cursor.style.cssText='position:fixed;width:15px;height:15px;border:1px solid #f4e5d2;border-radius:50%;background:#c18c6240;pointer-events:none;z-index:99999;transform:translate(-50%,-50%);opacity:0';document.body.append(cursor);for(const ev of ['pointermove','pointerdown'])addEventListener(ev,e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px';cursor.style.opacity='.9';cursor.style.scale=ev==='pointerdown'?'1.4':'1'});addEventListener('pointerup',()=>cursor.style.scale='1')})});
 const p=await ctx.newPage(),video=p.video(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const cdp=mobile?await ctx.newCDPSession(p):null;
 const wait=ms=>p.waitForTimeout(ms);
 async function swipe(x,y,dx,dy,steps=45){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=steps;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/steps,y:y+dy*i/steps}]});await wait(16)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}
 async function show(selector){await p.locator(selector).scrollIntoViewIfNeeded();await wait(700)}
 await p.goto(base+'?lang='+ (mobile?'ru':'en'));await p.waitForFunction(()=>window.__NOCT_3D__?.status==='ready');await wait(1400);
 if(mobile)await show('#hero-sculpture');
 await p.evaluate(()=>{window.__NOCT_3D__.frameTimes=[];window.__NOCT_3D__.renderTimes=[]});
 const start=performance.now();
 if(mobile){await swipe(95,500,190,-2,95);await wait(850);await swipe(280,500,-155,3,80)}
 else{const r=await p.locator('#hero-sculpture .bottle-touch').boundingBox();await p.mouse.move(r.x+r.width*.3,r.y+r.height*.6);await p.mouse.down();for(let i=1;i<=160;i++){await p.mouse.move(r.x+r.width*(.3+.4*Math.sin(i/160*Math.PI)),r.y+r.height*(.6+.025*Math.sin(i/25)));await wait(16)}await p.mouse.up()}
 await wait(900);
 const timing=await p.evaluate(()=>({frames:[...window.__NOCT_3D__.frameTimes],render:[...window.__NOCT_3D__.renderTimes],renderer:window.__NOCT_3D__.renderer,triangles:window.__NOCT_3D__.triangles,drawCalls:window.__NOCT_3D__.drawCalls}));
 await p.locator('#hero-sculpture .bottle-toolbar button').last().click();await wait(800);
 if(mobile)await p.locator('#hero-sculpture .cap-toggle').click();else{const a=await p.evaluate(()=>window.__NOCT_3D__.capScreen);await p.mouse.click(a.x,a.y)}
 await p.waitForFunction(()=>window.__NOCT_3D__.cap>.98);await wait(300);
 if(mobile)await p.locator('#hero-sculpture .spray-button').click();else{const a=await p.evaluate(()=>window.__NOCT_3D__.headScreen);await p.mouse.click(a.x,a.y)}await wait(950);
 await p.screenshot({path:`evidence/3d/${mobile?'mobile':'desktop'}-opened.jpg`,quality:94});
 await show('#ritual .note-layers');await p.locator('.note-layer').first().click();await wait(900);await p.screenshot({path:`evidence/3d/${mobile?'mobile':'desktop'}-notes-panel.jpg`,quality:92});await p.locator('dialog .close').click();await wait(600);
 await show('#selection-sculpture');await wait(650);await show('.collection-order');await p.locator('.collection-order .sizes button').filter({hasText:'100'}).click();await p.locator('.add-button').click();await wait(650);await p.locator('.quantity button').last().click();await wait(700);await p.screenshot({path:`evidence/3d/${mobile?'mobile':'desktop'}-cart.jpg`,quality:92});await p.locator('dialog .close').click();await wait(600);
 await show('.scene-tabs');await p.getByRole('tab',{name:/RAIN/}).click();await wait(700);await p.getByRole('tab',{name:/VEIL/}).click();await wait(700);
 await show('#discovery .sample-builder');for(const name of ['EMBER','RAIN','VEIL']){await p.locator('.sample-options button').filter({hasText:name}).click();await wait(160)}await p.locator('.sample-builder>.primary').click();await wait(500);await p.locator('.cart-summary .primary').click();await wait(900);await p.locator('dialog .close').click();await wait(500);
 await show('#hero-sculpture');await wait(600);
 const final=await p.evaluate(()=>({id:window.__NOCT_3D__.instanceId,loads:window.__NOCT_3D__.assetLoads,cap:window.__NOCT_3D__.cap,canvases:document.querySelectorAll('canvas').length,overflow:document.documentElement.scrollWidth-innerWidth,activeVideo:[...document.querySelectorAll('video')].some(v=>!v.paused)}));
 const f=timing.frames,r=timing.render;
 results.runs.push({mobile,viewport,deviceScaleFactor:mobile?2:1,cappedRendererDPR:mobile?1.25:1,interactionDurationMs:Math.round(performance.now()-start),samples:f.length,frameIntervalMs:{median:percentile(f,.5),p95:percentile(f,.95),max:Math.max(...f),over33ms:f.filter(x=>x>33.34).length},renderSubmissionMs:{median:percentile(r,.5),p95:percentile(r,.95),max:Math.max(...r)},renderer:timing.renderer,triangles:timing.triangles,drawCalls:timing.drawCalls,final,errors,rawFrameIntervals:f,rawRenderSubmission:r});
 await p.close();await video.saveAs(`evidence/3d/${mobile?'mobile':'desktop'}-full-scenario.webm`);await ctx.close();
}
await record(false);await record(true);fs.writeFileSync('evidence/3d/performance.json',JSON.stringify(results,null,2));console.log(JSON.stringify({...results,runs:results.runs.map(({rawFrameIntervals,rawRenderSubmission,...x})=>x)}));await browser.close();
