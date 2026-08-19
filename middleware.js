import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

// 1. Specify protected and public routes
const protectedRoutes = ['/', '/dashboard', '/participants', '/draw', '/scan', '/coupon'];
const publicRoutes = ['/login'];

export default async function middleware(req) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isPublicRoute = publicRoutes.includes(path);
  
  // FIX: Ensure public routes are NEVER considered protected
  // Also fix '/' matching everything
  const isProtectedRoute = !isPublicRoute && protectedRoutes.some(route => {
    if (route === '/') return path === '/';
    return path.startsWith(route);
  });

  // 3. Decrypt the session from the cookie
  const cookie = req.cookies.get('session')?.value;
  const session = await decrypt(cookie);

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 5. Redirect authenticated users away from /login to their landing page
  if (isPublicRoute && session?.userId) {
    const target = session.role === 'admin' ? '/' : '/scan';
    return NextResponse.redirect(new URL(target, req.nextUrl));
  }

  // 6. Role-based access control (Optional but recommended)
  // Scanner role should not access /participants or /draw
  if (session?.role === 'scanner' && (path.startsWith('/participants') || path.startsWith('/draw'))) {
      // Redirect scanner to their main page if they try to access admin pages
      return NextResponse.redirect(new URL('/scan', req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
