export type Role = 'admin' | 'staff';

export type Permission =
  | 'settings:read'
  | 'settings:write'
  | 'backup:read'
  | 'backup:write';

export const ROLE_PERMS: Record<Role, Permission[]> = {
  admin: ['settings:read','settings:write','backup:read','backup:write'],
  staff: ['settings:read','backup:read'],
};
