import fs from 'node:fs';
fs.writeFileSync('src/main.tsx',`import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport App from './App';\nimport './style.css';\ncreateRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);\n`);
