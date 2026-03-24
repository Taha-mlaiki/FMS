const ROLE_COOKIE_NAME = 'userRole';
const ROLE_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

function normalizeRole(role: unknown): 'OWNER' | 'WORKER' | null {
  if (typeof role !== 'string') return null;
  const upper = role.toUpperCase();
  if (upper === 'OWNER' || upper === 'WORKER') return upper;
  return null;
}

export function setUserRoleCookie(role: unknown) {
  if (globalThis.document === undefined) return;

  const normalizedRole = normalizeRole(role);
  if (!normalizedRole) {
    clearUserRoleCookie();
    return;
  }

  globalThis.document.cookie = `${ROLE_COOKIE_NAME}=${normalizedRole}; Path=/; Max-Age=${ROLE_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearUserRoleCookie() {
  if (globalThis.document === undefined) return;
  globalThis.document.cookie = `${ROLE_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}
