-- RBAC schema (Postgres)
-- Adds tables for permissions, roles, mappings, and user-role assignments.

CREATE TABLE IF NOT EXISTS permissions (
  perm TEXT PRIMARY KEY,
  note TEXT
);

CREATE TABLE IF NOT EXISTS roles (
  id   TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id TEXT REFERENCES roles(id) ON DELETE CASCADE,
  perm    TEXT REFERENCES permissions(perm) ON DELETE CASCADE,
  PRIMARY KEY (role_id, perm)
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_key TEXT NOT NULL, -- email or user id; your choice
  role_id  TEXT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_key, role_id)
);
