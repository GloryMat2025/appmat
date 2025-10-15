// src/utils/commands.js
// Lightweight command registry with pluggable providers (dynamic results)

const REG = new Map();                 // static commands: id -> cmd
const PROVIDERS = new Set();           // functions: (q) => Promise<Cmd[]> | Cmd[]

/** Command shape:
 * { id, title, hint?, kb?, group?, run:() => void, keywords? }
 */

export function registerCommand(cmd) {
  if (!cmd?.id || !cmd?.title || typeof cmd.run !== "function") return;
  REG.set(cmd.id, { ...cmd, keywords: norm((cmd.keywords || cmd.title || "")) });
}
export function registerProvider(fn) {
  if (typeof fn === "function") PROVIDERS.add(fn);
}
export function clearProviders() { PROVIDERS.clear(); }

export function listCommands() { return Array.from(REG.values()); }

export async function searchCommands(q) {
  const s = norm(q);
  const statics = listCommands();
  const providedArrays = await Promise.all([...PROVIDERS].map(fn => Promise.resolve(fn(s))));
  const provided = providedArrays.flat().filter(Boolean);

  // merge, de-dupe by id (providers may override statics)
  const all = new Map();
  [...statics, ...provided].forEach(c => {
    if (!c?.id || !c?.title || typeof c.run !== "function") return;
    all.set(c.id, c);
  });

  const scored = [];
  all.forEach((c) => scored.push({ c, score: rank(c, s) }));
  return scored
    .filter(x => x.score > (s ? 0 : -1))           // if empty query, keep all
    .sort((a,b)=> b.score - a.score)
    .map(x => x.c)
    .slice(0, 40);

  function rank(cmd, s) {
    if (!s) return 1; // neutral for empty query
    const hay = norm(cmd.title + " " + (cmd.hint||"") + " " + (cmd.keywords||"") + " " + (cmd.group||""));
    let p = 0;
    s.split(/\s+/).forEach(tok => { if (hay.includes(tok)) p += 1; });
    // slight boost for group matches / startsWith
    if (hay.startsWith(s)) p += 1;
    if (cmd.group && norm(cmd.group).includes(s)) p += 0.5;
    return p;
  }
}

function norm(x){ return String(x||"").toLowerCase().trim(); }
