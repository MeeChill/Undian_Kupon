import { NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';
import { cookies } from 'next/headers';

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
  const cookie = cookies().get('session')?.value;
  const session = await decrypt(cookie);

  // 4. Redirect to /login if the user is not authenticated
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL('/login', req.nextUrl));
  }

  // 5. Redirect to /dashboard if the user is authenticated
  if (isPublicRoute && session?.userId) {
      // Allow access to login page even if authenticated (optional), 
      // OR redirect to dashboard.
      // Current logic redirects to dashboard if trying to access login while logged in.
      // If "accessed by everyone" means public can see it, it is already public.
      // But if user means "don't redirect to dashboard if already logged in", remove this block.
      // However, usually "accessible by everyone" means unauthenticated users can see it.
      // Which is ALREADY true because publicRoutes includes '/login'.
      
      // WAIT, maybe the user means "Make the dashboard accessible to everyone"? 
      // "Buat agar login page bisa di akses semua orang" -> Make login page accessible to everyone.
      // Currently, it IS accessible to everyone (unauthenticated).
      // Authenticated users are redirected away. Maybe they want to stay on login page?
      
      // Let's assume the user simply wants to ensure /login is not blocked.
      // It is NOT blocked for unauth users.
      // It IS blocked (redirected) for auth users.
      
      // Let's remove the redirect for authenticated users so they can see the login page too (e.g. to switch accounts).
      // return NextResponse.redirect(new URL('/', req.nextUrl));
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
