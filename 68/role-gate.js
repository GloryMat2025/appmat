/**
 * Client-side role-based UI gating
 * Usage: await applyRoleGate({ roleBadge, adminSelectors })
 * - roleBadge: selector for badge element
 * - adminSelectors: array of selectors for admin-only controls
 * Relies on window.currentUser = { roles: [...] }
 */
export async function applyRoleGate({ roleBadge, adminSelectors = [] }) {
  // Simulate user roles; replace with real user fetch/session as needed
  const user = window.currentUser || { roles: [] };
  const roles = user.roles || [];
  // Render badge
  if (roleBadge) {
    const el = document.querySelector(roleBadge);
    if (el) {
      if (roles.includes("admin")) {
        el.textContent = "Admin";
        el.classList.add("bg-red-600","text-white");
      } else if (roles.includes("staff")) {
        el.textContent = "Staff (view only)";
        el.classList.add("bg-gray-400","text-white");
      } else {
        el.textContent = "Guest";
        el.classList.add("bg-gray-200","text-gray-600");
      }
    }
  }
  // Gate admin controls
  if (!roles.includes("admin")) {
    for (const sel of adminSelectors) {
      document.querySelectorAll(sel).forEach(el => {
        el.setAttribute("disabled", "disabled");
        el.classList.add("opacity-50","pointer-events-none");
        el.title = "Admin only";
      });
    }
  }
}
// role-gate.js
// Simple role-based access control utility

/**
 * Checks if a user has the required role(s).
 * @param {string[]} userRoles - Roles assigned to the user
 * @param {string|string[]} required - Required role or roles
 * @returns {boolean}
 */
export function hasRole(userRoles, required) {
  if (!Array.isArray(userRoles)) return false;
  if (Array.isArray(required)) {
    return required.some(r => userRoles.includes(r));
  }
  return userRoles.includes(required);
}

/**
 * Middleware for Express (Node.js) to protect routes by role.
 * Usage: app.use('/admin', requireRole(['admin']))
 */
export function requireRole(required) {
  return (req, res, next) => {
    const user = req.user || {};
    const roles = user.roles || [];
    if (hasRole(roles, required)) return next();
    res.status(403).json({ error: 'Forbidden: insufficient role' });
  };
}
