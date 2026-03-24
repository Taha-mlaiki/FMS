const ACCESS_TOKEN_COOKIE = 'accessToken';

/**
 * Stores the access token in a readable (non-httpOnly) cookie so that
 * Next.js middleware can decode it on every request to extract the user's role.
 * The cookie has no explicit MaxAge so it persists until the browser is closed
 * (the refresh token, managed server-side, acts as the durable session marker).
 */
export function setAccessTokenCookie(token: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=${token}; Path=/; SameSite=Lax`;
}

export function clearAccessTokenCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${ACCESS_TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
