
// ---- Drift Guard helpers ----
function readSuiteLastReport(suiteName){
  const base = String(suiteName).replace(/[^a-zA-Z0-9._-]/g,'');
  const reportsDir = path.resolve(PUBLIC_DIR, 'config/suites/reports');
  const lastPath = path.join(reportsDir, `${base}-last.json`);
  if (!fs.existsSync(lastPath)) return { exists:false };
  const stat = fs.statSync(lastPath);
  let j = {};
  try{ j = JSON.parse(fs.readFileSync(lastPath, 'utf-8')); } catch {}
  const ts = j.generated_at ? Date.parse(j.generated_at) : stat.mtimeMs;
  const rows = Array.isArray(j.rows) ? j.rows : [];
  const fails = rows.reduce((n,r)=> n + (r && r.ok === false ? 1 : 0), 0);
  return { exists:true, ts, rowsCount: rows.length, fails };
}

function driftGuardEvaluate(suiteName){
  const enabled = String(process.env.DRIFT_GUARD_ENABLED||'true').toLowerCase() === 'true';
  if (!enabled) return { enabled:false, ok:true };
  const windowMin = parseInt(process.env.DRIFT_GUARD_WINDOW_MIN||'240',10);
  const requireGreen = String(process.env.DRIFT_GUARD_REQUIRE_GREEN||'true').toLowerCase()==='true';
  const maxFails = parseInt(process.env.DRIFT_GUARD_MAX_FAILS|| (requireGreen ? '0' : '9999'),10);

  const last = readSuiteLastReport(suiteName);
  if (!last.exists) return { enabled, ok:false, freshness_ok:false, quality_ok:false, ageMin:Infinity, windowMin, fails:Infinity, maxFails };

  const ageMin = Math.max(0, Math.round((Date.now() - last.ts)/60000));
  const freshness_ok = ageMin <= windowMin;
  const quality_ok = last.fails <= maxFails;
  const ok = freshness_ok && quality_ok;

  return { enabled, ok, freshness_ok, quality_ok, ageMin, windowMin, fails: last.fails, maxFails };
}

// Status endpoint
app.get('/api/admin/drift-guard/status', authLimiter, requireAuth, requireAdmin, (req,res)=>{
  const name = (req.query.name||'').toString();
  if (!name) return res.status(400).json({ ok:false, error:'name required' });
  return res.json({ ok:true, status: driftGuardEvaluate(name.replace(/\.json$/,'')) });
});
