import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const p=await browser.newPage({viewport:{width:1440,height:1000}});
await p.goto((process.env.NOCT_3D_URL||'http://127.0.0.1:5180/noct-3d-preview/')+'?lang=en');await p.waitForFunction(()=>window.__NOCT_3D__?.status==='ready');
await p.locator('#hero-sculpture .cap-toggle').click();await p.locator('#collection').scrollIntoViewIfNeeded();await p.waitForTimeout(900);
const state=await p.evaluate(()=>[...document.querySelectorAll('.scene-anchor')].map(a=>({id:a.id,active:a.hasAttribute('data-bottle-active'),bar:a.querySelector('.bottle-toolbar').getBoundingClientRect().toJSON(),style:getComputedStyle(a.querySelector('.bottle-toolbar')).visibility,buttons:[...a.querySelectorAll('button')].map(b=>({text:b.innerText,r:b.getBoundingClientRect().toJSON(),visibility:getComputedStyle(b).visibility}))})));
console.log(JSON.stringify(state,null,2));fs.writeFileSync('evidence/3d/ui-audit.json',JSON.stringify(state,null,2));await p.screenshot({path:'evidence/3d/ui-collection.jpg',quality:94});await browser.close();
