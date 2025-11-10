import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const AUTH_COOKIE = 'auth-token';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get(AUTH_COOKIE);
  const isLoginPage = request.nextUrl.pathname === '/login';
  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

  // Allow access to login page and auth API routes
  if (isLoginPage || isAuthRoute) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!authToken || authToken.value !== 'authenticated') {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
