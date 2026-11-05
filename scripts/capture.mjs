import {chromium} from '@playwright/test';
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
await page.goto('http://127.0.0.1:5174/noct/');
await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:'evidence/hero-desktop.jpg',quality:92});
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'evidence/hero-mobile.jpg',quality:92,fullPage:true});
await browser.close();
