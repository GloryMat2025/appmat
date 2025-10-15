import { query } from './db.js';

export async function seedDefaults(){
  // Basic permission set (extend as needed)
  const perms = [
    ['settings:read','Read settings'],
    ['settings:write','Edit settings'],
    ['metrics:read','View metrics'],
    ['audit:read','View audit logs'],
    ['backups:read','List/download backups'],
    ['backups:write','Run/delete backups, schedules'],
    ['users:read','View users'],
    ['users:write','Manage users'],
  ];
  for (const [perm,note] of perms){
    await query('INSERT INTO permissions(perm,note) VALUES ($1,$2) ON CONFLICT (perm) DO NOTHING', [perm,note]);
  }

  // Roles
  const roles = [
    ['admin','Administrator','Full access'],
    ['ops','Operations','Backups & metrics'],
    ['auditor','Auditor','Read audit & metrics'],
    ['staff','Staff','Basic read access']
  ];
  for (const [id,name,note] of roles){
    await query('INSERT INTO roles(id,name,note) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING', [id,name,note]);
  }

  // Role → permissions
  async function grant(role, perm){
    await query('INSERT INTO role_permissions(role_id,perm) VALUES ($1,$2) ON CONFLICT DO NOTHING', [role,perm]);
  }
  // Admin: everything
  const all = await query('SELECT perm FROM permissions');
  for (const p of all.rows){ await grant('admin', p.perm); }

  // Ops
  for (const p of ['metrics:read','backups:read','backups:write']) await grant('ops', p);
  // Auditor
  for (const p of ['metrics:read','audit:read']) await grant('auditor', p);
  // Staff
  for (const p of ['metrics:read']) await grant('staff', p);
}

export async function listAll(){
  const perms = (await query('SELECT perm,note FROM permissions ORDER BY perm')).rows;
  const roles = (await query('SELECT id,name,note FROM roles ORDER BY id')).rows;
  const maps  = (await query('SELECT role_id,perm FROM role_permissions')).rows;
  const users = (await query('SELECT user_key,role_id FROM user_roles')).rows;
  return { perms, roles, maps, users };
}

export async function upsertPerm(perm, note=''){
  await query('INSERT INTO permissions(perm,note) VALUES ($1,$2) ON CONFLICT (perm) DO UPDATE SET note=EXCLUDED.note', [perm, note]);
  return true;
}
export async function deletePerm(perm){
  await query('DELETE FROM permissions WHERE perm=$1', [perm]);
  return true;
}

export async function upsertRole(id, name, note=''){
  await query('INSERT INTO roles(id,name,note) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, note=EXCLUDED.note', [id, name, note]);
  return true;
}
export async function deleteRole(id){
  await query('DELETE FROM roles WHERE id=$1', [id]);
  return true;
}

export async function grant(roleId, perm){
  await query('INSERT INTO role_permissions(role_id,perm) VALUES ($1,$2) ON CONFLICT DO NOTHING', [roleId, perm]);
  return true;
}
export async function revoke(roleId, perm){
  await query('DELETE FROM role_permissions WHERE role_id=$1 AND perm=$2', [roleId, perm]);
  return true;
}

export async function assign(userKey, roleId){
  await query('INSERT INTO user_roles(user_key,role_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [userKey, roleId]);
  return true;
}
export async function unassign(userKey, roleId){
  await query('DELETE FROM user_roles WHERE user_key=$1 AND role_id=$2', [userKey, roleId]);
  return true;
}

export async function permsForUser(user){
  const key = (user?.email || user?.id || '').toLowerCase();
  if (!key) return new Set();
  const r = await query(`
    SELECT rp.perm FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    WHERE ur.user_key = $1
  `, [key]);
  return new Set(r.rows.map(x => x.perm));
}
