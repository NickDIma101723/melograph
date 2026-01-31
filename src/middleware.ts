import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

// 1. Specify protected and public routes
const protectedRoutes = ['/dashboard', '/profile'];
const publicRoutes = ['/auth', '/', '/auth/reset-password'];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) => path.startsWith(route));
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = req.cookies.get('session')?.value;
  let session = null;
  if (cookie) {
      try {
          session = await decrypt(cookie);
      } catch (e) {
          // invalid session
      }
  }

  // 4. Redirect to /auth if the user is not authenticated
  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth', req.nextUrl));
  }

  // 5. Redirect to /profile if the user is authenticated
  if (
    isPublicRoute &&
    session &&
    !req.nextUrl.pathname.startsWith('/dashboard') &&
    path !== '/' // Allow logged in users to visit home
  ) {
    if (path === '/auth') {
       return NextResponse.redirect(new URL('/profile', req.nextUrl)); 
    }
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
