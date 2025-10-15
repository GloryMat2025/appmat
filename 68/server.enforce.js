
// --- Promotion enforcement (single) ---
// Find your existing endpoint and merge the bits below:
app.post('/api/admin/github/promotion-pr', requireCsrf, authLimiter, requireAuth, requireAdmin, async (req, res) => {
  const { name, merge=false, dryRun=false, excludeQuarantined=true, driftOverride=false } = req.body || {};
  const allowOverride = String(process.env.DRIFT_GUARD_ALLOW_OVERRIDE||'false').toLowerCase()==='true';
  const base = String(name||'').replace(/\.json$/,'');

  const guard = driftGuardEvaluate(base);
  if (guard.enabled && !(allowOverride && driftOverride) && !guard.ok){
    saveAudit({ type:'promotion_guard_blocked', suite: base, guard });
    return res.status(412).json({
      ok:false,
      error:`Drift guard: fresh green run required in last ${guard.windowMin} min (age ${guard.ageMin} min; fails ${guard.fails}/${guard.maxFails}).`,
      guard
    });
  }
  if (guard.enabled && allowOverride && driftOverride){
    saveAudit({ type:'promotion_guard_override', suite: base, guard });
  }

  // ...rest of your existing promotion logic...
});

// --- Promotion enforcement (batch) ---
// Inside the batch endpoint, in the for-loop:
const allowOverride = String(process.env.DRIFT_GUARD_ALLOW_OVERRIDE||'false').toLowerCase()==='true';
for (const s of suites){
  const suiteBase = String(s).replace(/\.json$/,'');
  const guard = driftGuardEvaluate(suiteBase);
  if (guard.enabled && !(allowOverride && driftOverride) && !guard.ok){
    out.push({ suite:s, ok:false, error:'drift-guard', guard });
    continue;
  }
  // ... continue with each suite's dispatch ...
}
