import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Define public paths that should bypass middleware
const publicPaths = [
  '/sign-in',
  '/sign-up', 
  '/forgot-password', 
  '/reset-password', 
  '/auth/callback',
  '/_next',
  '/api',
  '/favicon.ico'
];

export async function middleware(req: NextRequest) {
  const pathname = new URL(req.url).pathname;
  
  // Skip middleware for public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const { supabase, response } = createClient(req);

  // Check if user is authenticated - all routes are protected by default
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Redirect to sign-in for unauthenticated users
    const redirectUrl = new URL('/sign-in', req.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next|_static|_vercel|[^?]*\\..*).*)',
    '/api/(.*)'
  ]
};