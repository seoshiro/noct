import {chromium} from '@playwright/test';
import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://127.0.0.1:5180/noct-3d-preview/?lang=en');await page.waitForFunction(()=>window.__NOCT_3D__?.status==='ready',{timeout:30000});await page.waitForTimeout(900);await page.screenshot({path:'evidence/3d/site-front.jpg',quality:94});
const hero=page.locator('#hero-sculpture');await hero.getByRole('button',{name:'Lift the cap',exact:true}).click();await page.waitForTimeout(850);await page.screenshot({path:'evidence/3d/site-open.jpg',quality:94});await hero.getByRole('button',{name:'Press the atomizer'}).click();await page.waitForTimeout(180);await page.screenshot({path:'evidence/3d/site-spray.jpg',quality:94});await page.waitForTimeout(850);
await page.locator('#ritual').scrollIntoViewIfNeeded();await page.waitForTimeout(800);await page.screenshot({path:'evidence/3d/site-notes.jpg',quality:92});
await page.locator('#collection').scrollIntoViewIfNeeded();await page.waitForTimeout(900);await page.screenshot({path:'evidence/3d/site-selection.jpg',quality:92});
await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5180/noct-3d-preview/?lang=ru');await page.waitForFunction(()=>window.__NOCT_3D__?.status==='ready');await page.waitForTimeout(800);await page.screenshot({path:'evidence/3d/site-mobile.jpg',quality:94});
console.log(JSON.stringify({errors,metrics:await page.evaluate(()=>window.__NOCT_3D__),overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)}));await browser.close();
