import { Router } from 'express';
import { requirePerm } from '../middleware/perm.js';
import { listAll, upsertPerm, deletePerm, upsertRole, deleteRole, grant, revoke, assign, unassign, seedDefaults } from '../lib/rbac_pg.js';

const r = Router();

r.get('/all', requirePerm('settings:read'), async (_req,res)=> res.json(await listAll()));
r.post('/seed', requirePerm('settings:write'), async (_req,res)=>{ await seedDefaults(); res.json({ ok:true }); });

// Permissions
r.post('/perm', requirePerm('settings:write'), async (req,res)=>{
  const { perm, note='' } = req.body || {};
  if (!perm) return res.status(400).json({ error:'perm_required' });
  await upsertPerm(perm, note); res.json({ ok:true });
});
r.delete('/perm/:perm', requirePerm('settings:write'), async (req,res)=>{ await deletePerm(req.params.perm); res.json({ ok:true }); });

// Roles
r.post('/role', requirePerm('settings:write'), async (req,res)=>{
  const { id, name, note='' } = req.body || {};
  if (!id || !name) return res.status(400).json({ error:'id_and_name_required' });
  await upsertRole(id, name, note); res.json({ ok:true });
});
r.delete('/role/:id', requirePerm('settings:write'), async (req,res)=>{ await deleteRole(req.params.id); res.json({ ok:true }); });

// Grants
r.post('/grant', requirePerm('settings:write'), async (req,res)=>{
  const { roleId, perm } = req.body || {};
  if (!roleId || !perm) return res.status(400).json({ error:'roleId_and_perm_required' });
  await grant(roleId, perm); res.json({ ok:true });
});
r.post('/revoke', requirePerm('settings:write'), async (req,res)=>{
  const { roleId, perm } = req.body || {};
  if (!roleId || !perm) return res.status(400).json({ error:'roleId_and_perm_required' });
  await revoke(roleId, perm); res.json({ ok:true });
});

// User assignments
r.post('/assign', requirePerm('settings:write'), async (req,res)=>{
  const { userKey, roleId } = req.body || {};
  if (!userKey || !roleId) return res.status(400).json({ error:'userKey_and_roleId_required' });
  await assign(userKey.toLowerCase(), roleId); res.json({ ok:true });
});
r.post('/unassign', requirePerm('settings:write'), async (req,res)=>{
  const { userKey, roleId } = req.body || {};
  if (!userKey || !roleId) return res.status(400).json({ error:'userKey_and_roleId_required' });
  await unassign(userKey.toLowerCase(), roleId); res.json({ ok:true });
});

export default r;
