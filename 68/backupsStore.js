// In-memory backup store + scheduler (demo). Replace with DB + real job runner in production.
import crypto from 'crypto';

export const store = {
  items: [], // { id, created, type, sizeBytes, checksum, url? }
  schedules: [], // { id, everyMinutes, type, enabled, lastRunAt? }
};

// Helpers
export function addBackup({ type='full', sizeBytes=null } = {}){
  const id = 'bkp_' + Math.random().toString(36).slice(2,10);
  const size = sizeBytes ?? (type==='data' ? 250*1024*1024 : 2*1024*1024*1024);
  const item = { id, created: new Date().toISOString(), type, sizeBytes: size, checksum: 'sha256:'+Math.random().toString(16).slice(2,10) };
  store.items.push(item);
  return item;
}
export function listBackups(){ return store.items.slice().sort((a,b)=> (a.created < b.created ? 1 : -1)); }
export function findBackup(id){ return store.items.find(b => b.id === id); }
export function deleteBackup(id){ const n = store.items.length; store.items = store.items.filter(b => b.id !== id); return store.items.length !== n; }

// Signed URL generator (HMAC)
export function signUrl(baseUrl, id, secret, ttlSec=300){
  const exp = Math.floor(Date.now()/1000) + ttlSec;
  const data = id + '.' + exp;
  const sig = crypto.createHmac('sha256', String(secret || 'devsecret')).update(data).digest('hex');
  return `${baseUrl}/api/backups2/download/${id}?exp=${exp}&sig=${sig}`;
}
export function verifySig(id, exp, sig, secret){
  if (!id || !exp || !sig) return false;
  if (Date.now()/1000 > Number(exp)) return false;
  const data = id + '.' + exp;
  const expect = crypto.createHmac('sha256', String(secret || 'devsecret')).update(data).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
}

// Scheduler (simple setInterval list, supports fixed interval in minutes)
const timers = new Map(); // scheduleId -> intervalId
export function addSchedule({ type='full', everyMinutes=1440 }){
  const id = 'sch_' + Math.random().toString(36).slice(2,10);
  const rec = { id, everyMinutes, type, enabled: true, lastRunAt: null };
  store.schedules.push(rec);
  startTimer(rec);
  return rec;
}
export function listSchedules(){ return store.schedules.slice(); }
export function setScheduleEnabled(id, enabled){
  const s = store.schedules.find(x=>x.id===id); if (!s) return false;
  s.enabled = !!enabled;
  if (enabled) startTimer(s); else stopTimer(s.id);
  return true;
}
export function removeSchedule(id){
  stopTimer(id);
  const n = store.schedules.length;
  store.schedules = store.schedules.filter(s=>s.id!==id);
  return store.schedules.length !== n;
}

function startTimer(s){
  stopTimer(s.id);
  if (!s.enabled) return;
  const ms = Math.max(1, s.everyMinutes) * 60 * 1000;
  const h = setInterval(()=> {
    const b = addBackup({ type: s.type });
    s.lastRunAt = b.created;
  }, ms);
  timers.set(s.id, h);
}
function stopTimer(id){
  const h = timers.get(id);
  if (h){ clearInterval(h); timers.delete(id); }
}
