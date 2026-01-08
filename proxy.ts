import { neonAuthMiddleware } from '@neondatabase/auth/next/server';

export default neonAuthMiddleware({
  // Redirects unauthenticated users to sign-in page
  loginUrl: '/auth/sign-in',
});

export const config = {
  matcher: [
    // Protect dashboard routes except auth pages and static assets
    '/account/:path*',
    '/',
  ],
};
