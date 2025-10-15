
/**
 * audit-client.js
 * Small utilities to diff configs and POST to server for audit logging.
 */

export function jsonDiff(before, after){
  // Minimal structural diff: lists changed paths with before/after values
  const changes = [];
  function walk(a, b, path=""){
    const keys = new Set([...(a ? Object.keys(a) : []), ...(b ? Object.keys(b) : [])]);
    for (const k of keys){
      const pa = path ? `${path}.${k}` : k;
      const va = a ? a[k] : undefined;
      const vb = b ? b[k] : undefined;
      const ta = Object.prototype.toString.call(va);
      const tb = Object.prototype.toString.call(vb);
      if (ta === "[object Object]" && tb === "[object Object]"){
        walk(va, vb, pa);
      } else if (JSON.stringify(va) !== JSON.stringify(vb)){
        changes.push({ path: pa, before: va, after: vb });
      }
    }
  }
  walk(before || {}, after || {});
  return changes;
}

export async function getCsrfToken(){
  try{ const r = await fetch('/api/csrf', { credentials:'include' }); const j = await r.json(); return j.token; }catch(e){ void e; return null; }
}

export async function postJSON(url, body, opts={}){
  const token = await getCsrfToken();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': token || '', ...(opts.headers||{}) },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(()=>({ ok:false, error:'Bad JSON' }));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export async function emitAudit(event){
  // event: { type, message, meta }
  try{
    return await postJSON('/api/admin/audit', event);
  }catch(e){
    console.warn('audit failed', e);
    return { ok:false, error: String(e) };
  }
}
