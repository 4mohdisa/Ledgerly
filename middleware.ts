import { getAuth } from "@clerk/nextjs/server";
import { clerkClient, clerkMiddleware } from "@clerk/nextjs/server";
import { createClient } from "@/utils/supabase/middleware";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

// Define protected routes
const protectedRoutes = [
  '/',
  '/transactions',
  '/recurring-transactions'
];

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId } = await auth();
  const { supabase, response } = createClient(req);
  const errorUrl = new URL('/auth-error', req.url);

  // Get the pathname from the URL
  const pathname = new URL(req.url).pathname;

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.includes(pathname);
  if (isProtectedRoute) {
    // Handle non-authenticated users for protected routes
    if (!userId) {
      return (await auth()).redirectToSignIn({ returnBackUrl: req.url });
    }

    try {
      // Get the JWT token from Clerk
      const token = await (await auth()).getToken({ template: 'supabase' });
      if (!token) {
        console.error('No auth token available');
        errorUrl.searchParams.set('code', 'no_token');
        return NextResponse.redirect(errorUrl);
      }

      // Set Supabase session
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: ""
      });

      // Get Clerk user details
      const clerk = await clerkClient();
      const clerkUser = await clerk.users.getUser(userId);
      if (!clerkUser.emailAddresses[0]?.emailAddress) {
        console.error('No email address found for user');
        errorUrl.searchParams.set('code', 'no_email');
        return NextResponse.redirect(errorUrl);
      }

      // Upsert user profile in Supabase
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: clerkUser.emailAddresses[0].emailAddress,
          name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'Anonymous',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        });

      if (upsertError) {
        console.error('Profile sync failed:', upsertError);
        console.warn('Continuing despite profile sync failure');
      }
    } catch (error: unknown) {
      console.error('Auth process failed:', error);
      if (error instanceof Error && error.message.includes('No auth token')) {
        errorUrl.searchParams.set('code', 'auth_process');
        return NextResponse.redirect(errorUrl);
      }
    }
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|_static|_vercel|[^?]*\\..*).*)',
    '/api/(.*)'
  ]
};