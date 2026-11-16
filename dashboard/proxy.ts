import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/** Must match SESSION_COOKIE in the API (src/lib/session.ts). */
const SESSION_COOKIE = 'omnisync_session';

/**
 * Redirects requests without a session cookie to the login page before any
 * dashboard page renders. The cookie is only checked for presence here; the API
 * verifies it on every data request and the AuthGuard confirms it on mount.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/login') {
    return NextResponse.next();
  }

  if (!request.cookies.has(SESSION_COOKIE)) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
