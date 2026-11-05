import {useState} from 'react';
import CrownScene,{type StudioView} from './CrownScene';
import './crown.css';
export default function CrownApp(){
 const query=new URLSearchParams(location.search),inspection=query.has('studio'),view=(query.get('view')||'front') as StudioView;
 const [lang,setLang]=useState<'en'|'ru'>(query.get('lang')==='ru'?'ru':'en'),[status,setStatus]=useState<'loading'|'ready'|'fallback'>('loading');
 return <div className="crown-page" data-studio={inspection?'true':'false'} data-renderer={status}>
  <CrownScene view={view} inspection={inspection} onStatus={setStatus}/>
  <img className="crown-poster" src={`${import.meta.env.BASE_URL}media/noct-crown-reference.png`} alt=""/>
  {!inspection&&<><header className="crown-header"><a href="#top" className="crown-logo">NOCT<span>PARFUMS DE NUIT</span></a><button className="crown-language" onClick={()=>setLang(lang==='en'?'ru':'en')}>{lang==='en'?'EN / RU':'RU / EN'}</button></header><main id="top"><section className="crown-hero"><p className="crown-kicker">NOCT / 01 — EMBER</p><h1>{lang==='en'?<>The night<br/>stays with you.</>:<>Ночь остаётся<br/>с тобой.</>}</h1><p className="crown-intro">{lang==='en'?'A trace of geranium. The warmth of tonka. Sandalwood, still on the skin.':'Герань. Тепло бобов тонка. Сандал, который остаётся на коже.'}</p><p className="crown-scroll">{lang==='en'?'Scroll to reveal the scent':'Прокрутите, чтобы раскрыть аромат'}<span>↓</span></p></section></main><p className="crown-concept">{lang==='en'?'Independent fragrance concept / studio study':'Авторский парфюмерный концепт / студийный этюд'}</p></>}
 </div>
}
