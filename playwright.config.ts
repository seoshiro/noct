import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/browser',use:{baseURL:process.env.NOCT_URL||'http://127.0.0.1:5174/noct/',channel:'chrome',viewport:{width:1440,height:1000}},workers:1,reporter:[['list'],['json',{outputFile:'evidence/browser-results.json'}]],retries:0});
