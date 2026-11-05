import fs from 'node:fs';
let s=fs.readFileSync('src/style.css','utf8');
s=s.replace(/^@import[^;]+;/,'@font-face{font-family:"Night Serif";src:url(/noct/fonts/CormorantGaramond.woff2) format("woff2");font-weight:300 700;font-display:swap}@font-face{font-family:"Night Sans";src:url(/noct/fonts/IBMPlexSans-Regular.woff2) format("woff2");font-weight:400;font-display:swap}');
s=s.replaceAll("'Cormorant Garamond'","'Night Serif'").replaceAll('Manrope','"Night Sans"');
fs.writeFileSync('src/style.css',s);
