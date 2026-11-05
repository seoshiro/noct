import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./tests/crown',timeout:50000,expect:{timeout:8000},workers:1,retries:0,use:{channel:'chrome',baseURL:process.env.NOCT_CROWN_URL||'http://127.0.0.1:5190/noct-crown-preview/',viewport:{width:1440,height:1000}},reporter:[['list'],['json',{outputFile:'evidence/crown/browser-tests.json'}]]});
