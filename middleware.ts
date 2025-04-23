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
  
  // Add Content Security Policy headers
  // Include 'unsafe-eval' to allow libraries like xlsx, mathjs, and llamaindex to function
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://gaphbnspyqosmklayzvj.supabase.co;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://*.supabase.co;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co https://api.openai.com;
    frame-src 'self';
    object-src 'none';
  `.replace(/\s+/g, ' ').trim();
  
  // Clone the response to add headers
  const newResponse = NextResponse.next();
  
  // Add CSP header to the response
  newResponse.headers.set('Content-Security-Policy', cspHeader);
  
  // Merge the headers with the Supabase response
  const finalResponse = response || newResponse;
  if (response && newResponse) {
    newResponse.headers.forEach((value, key) => {
      finalResponse.headers.set(key, value);
    });
  }
  
  return finalResponse;
}

export const config = {
  matcher: [
    '/((?!_next|_static|_vercel|[^?]*\\..*).*)',
    '/api/(.*)'
  ]
};