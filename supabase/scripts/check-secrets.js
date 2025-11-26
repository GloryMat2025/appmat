const fs = require('fs');
const d = JSON.parse(fs.readFileSync('supabase/secrets.json', 'utf8'));
Object.entries(d).forEach(([k, v]) => {
  const s = String(v);
  const issues = [];
  if (/\r|\n/.test(s)) issues.push('newline');
  if (/`/.test(s)) issues.push('backtick');
  if (/["']/.test(s)) issues.push('quote');
  if (/^\s|\s$/.test(s)) issues.push('leading/trailing-space');
  if (issues.length) console.log(k + ': ' + issues.join(', '));
});
