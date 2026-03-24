import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

// ─── next-intl middleware (locale detection + prefix) ────────────────────────
const intlMiddleware = createMiddleware(routing);

// ─── Route definitions ────────────────────────────────────────────────────────

/** Prefixes that only OWNER users may access. */
const OWNER_ROUTES = ['/owner', '/onboarding'];

/** Prefixes that only WORKER users may access. */
const WORKER_ROUTES = ['/worker'];

/**
 * Paths that are publicly accessible regardless of authentication state.
 * Unauthenticated users attempting any other route are sent back here.
 */
const PUBLIC_PATHS = ['/', '/login', '/register', '/unauthorized', '/forbidden'];

/** Path prefixes that are always public (e.g. invitation flow). */
const PUBLIC_PREFIXES = ['/invite'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripLocale(pathname: string): string {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return pathname.slice(locale.length + 1) || '/';
    }
  }
  return pathname;
}

function isPublicPath(pathname: string): boolean {
  const stripped = stripLocale(pathname);
  if (PUBLIC_PATHS.includes(stripped)) return true;
  return PUBLIC_PREFIXES.some((prefix) => stripped.startsWith(prefix));
}

/**
 * Decodes the payload section of a JWT without verifying the signature.
 * Used only to extract the `role` claim — actual token validity is enforced
 * by the API (which returns 401/403 on expired or tampered tokens).
 */
function decodeJwtPayload(token: string): Record<string, string> | null {
  try {
    const base64 = token.split('.')[1];
    if (!base64) return null;
    // base64url → base64
    const padded = base64.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json) as Record<string, string>;
  } catch {
    return null;
  }
}

/**
 * Resolves the user's role from the access-token cookie (primary source) or
 * the userRole cookie (fallback when the access token is missing/expired).
 * Returns null when neither source contains a recognisable role — this happens
 * briefly during session restore; in that case middleware lets the request
 * through and the client-side AuthProvider handles it.
 */
function resolveRole(
  accessToken: string | undefined,
  userRoleFallback: string | undefined,
): 'OWNER' | 'WORKER' | null {
  if (accessToken) {
    const payload = decodeJwtPayload(accessToken);
    const r = payload?.role?.toUpperCase();
    if (r === 'OWNER' || r === 'WORKER') return r;
  }
  if (userRoleFallback) {
    const r = userRoleFallback.toUpperCase();
    if (r === 'OWNER' || r === 'WORKER') return r as 'OWNER' | 'WORKER';
  }
  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const strippedPath = stripLocale(pathname);

  // The refresh-token httpOnly cookie is the canonical proof of authentication.
  const refreshToken = request.cookies.get('refreshToken')?.value;
  // The access token cookie is set client-side after login/refresh; used for
  // role extraction only (no signature verification).
  const accessToken = request.cookies.get('accessToken')?.value;
  // Long-lived fallback cookie updated whenever the active farm role changes.
  const userRoleCookie = request.cookies.get('userRole')?.value;

  const isAuthenticated = Boolean(refreshToken);
  const role = isAuthenticated ? resolveRole(accessToken, userRoleCookie) : null;

  // 1. Unauthenticated → redirect to home for any protected route.
  if (!isAuthenticated && !isPublicPath(pathname)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 2. Authenticated on auth pages → redirect to the appropriate dashboard.
  if (
    isAuthenticated &&
    (strippedPath === '/login' || strippedPath === '/register')
  ) {
    const dest = role === 'WORKER' ? '/worker/dashboard' : '/owner/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // 3. Role-based route protection.
  //    If the role cannot be determined yet (session still restoring) we let the
  //    request through — the AuthProvider will redirect if necessary.
  if (isAuthenticated && role) {
    const isOwnerRoute = OWNER_ROUTES.some((r) =>
      strippedPath.startsWith(r),
    );
    const isWorkerRoute = WORKER_ROUTES.some((r) =>
      strippedPath.startsWith(r),
    );

    if (isOwnerRoute && role === 'WORKER') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    if (isWorkerRoute && role === 'OWNER') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // 4. Run next-intl middleware for locale detection / prefix.
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
