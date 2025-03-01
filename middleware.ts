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
      // Debug: Log user ID and auth details
      const authResult = await auth();
      const { userId } = authResult;
      
      if (!userId) {
        console.error('No user ID available');
        errorUrl.searchParams.set('code', 'no_user_id');
        return NextResponse.redirect(errorUrl);
      }

      console.log('Debug - Auth Result:', {
        userId,
        sessionId: authResult.sessionId,
        sessionClaims: authResult.sessionClaims
      });

      try {
        // Get the JWT token from Clerk
        const token = await authResult.getToken({ template: 'supabase' });
        
        // Debug: Decode and log token payload
        if (token) {
          const [_header, payload, _signature] = token.split('.');
          const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());
          console.log('Debug - Clerk Token Payload:', decodedPayload);
        }
        if (!token) {
          console.error('No auth token available');
          errorUrl.searchParams.set('code', 'no_token');
          return NextResponse.redirect(errorUrl);
        }

        // Get Clerk user details for the JWT claims
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(userId);
        
        // Debug: Log Clerk user details
        console.log('Debug - Clerk User:', {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName
        });

        // Create a Supabase-compatible session
        const supabaseSession = {
          access_token: token,
          token_type: 'bearer',
          expires_in: 60 * 60 * 24 * 7, // 1 week
          expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
          refresh_token: '',
          user: {
            id: userId,
            aud: 'authenticated',
            role: 'authenticated',
            email: clerkUser.emailAddresses[0]?.emailAddress,
            app_metadata: {
              provider: 'clerk'
            },
            user_metadata: {
              email: clerkUser.emailAddresses[0]?.emailAddress,
              full_name: `${clerkUser.firstName ?? ''} ${clerkUser.lastName ?? ''}`.trim() || 'Anonymous'
            },
            sub: userId // This is what Supabase needs
          }
        };

        // Set auth header for this request
        await supabase.auth.setSession(supabaseSession);
        
        // Debug: Log Supabase session
        console.log('Debug - Supabase Session:', {
          ...supabaseSession,
          access_token: supabaseSession.access_token.substring(0, 20) + '...' // Only show part of the token for security
        });

        // Set the auth cookie
        const cookieName = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]}-auth-token`;
        response.cookies.set(cookieName, JSON.stringify(supabaseSession), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        });
      } catch (error) {
        console.error('Error setting up auth:', error);
        errorUrl.searchParams.set('code', 'auth_setup_failed');
        return NextResponse.redirect(errorUrl);
      }

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