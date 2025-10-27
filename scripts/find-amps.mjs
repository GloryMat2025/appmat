import { readFileSync } from 'fs';
const p = 'docs/architecture-refined.svg';
const s = readFileSync(p,'utf8').split(/\n/);
s.forEach((l,i)=>{ if(l.includes('&')) console.log((i+1)+':'+l); });
