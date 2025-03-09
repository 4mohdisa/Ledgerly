# Supabase Integration

Now after trying very hard to resolve session issue with clerk and supabase integration, I have decided to completely shift to supabase with supabase authentication, email and password integration along with option to sign in and sign up with google too, I also want forgot password integration implementation with confirmation code to be sent with email integration, I want proper integration following the below supabase documantation

# Documentation and resources

## Password-based Auth

Allow users to sign in with a password connected to their email.

### Signing up with an email and password

To sign up the user, call signUp() with their email address and password.

You can optionally specify a URL to redirect to after the user clicks the confirmation link. This URL must be configured as a Redirect URL, which you can do in the dashboard for hosted projects, or in the configuration file for self-hosted projects.

If you don't specify a redirect URL, the user is automatically redirected to your site URL. This defaults to localhost:3000, but you can also configure this.

``typescript
async function signUpNewUser() {
  const { data, error } = await supabase.auth.signUp({
    email: 'valid.email@supabase.io',
    password: 'example-password',
    options: {
      emailRedirectTo: 'https://example.com/welcome',
    },
  })
}
```

### Signing in with an email and password

When your user signs in, call signInWithPassword() with their email address and password:

```typescript
async function signInWithEmail() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'valid.email@supabase.io',
    password: 'example-password',
  })
}
```

### Current Supabase Integration Code

utils/supabase/client.ts

import { createBrowserClient } from '@supabase/ssr';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true, // Ensure sessions are persisted
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
};

utils/supabase/server.ts

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createClient = (cookieStore: ReturnType<typeof cookies>) => {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set(name, '', { ...options, maxAge: 0 })
          } catch (error) {
            // The `remove` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

utils/supabase/middleware.ts

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      },
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  return { supabase, response };
};

components/SupabaseAuthSync.tsx

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export function SupabaseAuthSync() {
  useEffect(() => {
    const supabase = createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return;

    // Get the token from cookies
    const cookieName = `sb-${supabaseUrl.split('//')[1]}-auth-token`;
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
    };

    const cookieValue = getCookie(cookieName);
    if (cookieValue) {
      try {
        const { access_token, refresh_token } = JSON.parse(cookieValue);
        if (access_token) {
          supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });
        }
      } catch (error) {
        console.error('Error parsing auth cookie:', error);
      }
    }
  }, []);

  return null;
}


components/auth/supabase-sync.tsx

// components/auth/supabase-sync.tsx
'use client';
import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createClient } from '@/utils/supabase/client';

export const SupabaseAuthSync = () => {
  const { getToken } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (!token) {
          console.error('No Supabase token available');
          return;
        }

        // Get the token from the cookie
        const accessToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('sb-access-token='))
          ?.split('=')[1];

        if (!accessToken) {
          console.error('No access token found in cookies');
          return;
        }

        // Set the session in Supabase
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: accessToken,
        });

        if (sessionError) {
          console.error('Error setting Supabase session:', sessionError);
        }
      } catch (error) {
        console.error('Error syncing Supabase auth:', error);
      }
    };

    syncAuth();
  }, [getToken]);

  return null;
};

components/providers/user-sync-provider.tsx

"use client"
import { useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/utils/supabase/client'
export function UserSyncProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useUser()
  const supabase = createClient()
  useEffect(() => {
    if (!user?.id) return;
    const syncWithRetry = async (attempt = 1) => {
      try {
        // Check if session exists first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('No active session, waiting for auth sync...');
          if (attempt < 3) {
            setTimeout(() => syncWithRetry(attempt + 1), 1000 * attempt);
          }
          return;
        }
        const { error } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            name: user.fullName,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'id'
          });
        if (error) {
          console.error('Profile sync error:', error);
          if (attempt < 3) {
            setTimeout(() => syncWithRetry(attempt + 1), 1000 * attempt);
          }
        } else {
          console.log('Profile synced successfully');
        }
      } catch (error) {
        console.error('Sync error:', error);
        if (attempt < 3) {
          setTimeout(() => syncWithRetry(attempt + 1), 1000 * attempt);
        }
      }
    };
    // Delay initial sync to allow auth setup
    const timeout = setTimeout(() => syncWithRetry(), 2000);
    return () => clearTimeout(timeout);
  }, [user?.id]);
  return children;
}

pages/transactions/create.ts

import { createClient } from '@/utils/supabase/server';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, amount, name, type, account_type, category_id, description } = req.body;

  const supabase = createClient(req, res);
  const { data: profile } = await supabase.auth.getUser();

  if (!profile?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([
      {
        user_id: profile.user.id,
        date,
        amount,
        name,
        type,
        account_type,
        category_id,
        description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ data });
}

pages/transactions/list.ts

import { createClient } from '@/utils/supabase/server';

export default async function handler(req, res) {
  const supabase = createClient(req, res);
  const { data: profile } = await supabase.auth.getUser();

  if (!profile?.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', profile.user.id)
    .order('date', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ data });
}

## Key files for authentication syncing are:

SupabaseAuthSync.tsx - Handles the core authentication sync between Clerk and Supabase
user-sync-provider.tsx - Manages user state and synchronization
/utils/supabase/middleware.ts - Handles authentication in API routes and server-side
/middleware.ts - Global middleware for authentication flow


Below is my file structure:

app
├── (dashboard)
│   ├── dashboard
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── recurring-transactions
│   │   └── page.tsx
│   └── transactions
│       └── page.tsx
├── api
│   └── auth
│       └── sign-out
│           └── route.ts
├── auth
│   └── callback
│       └── route.ts
├── auth-error
│   └── page.tsx
├── favicon.ico
├── fonts
│   ├── GeistMonoVF.woff
│   └── GeistVF.woff
├── forgot-password
│   └── page.tsx
├── globals.css
├── layout.tsx
├── metadata.ts
├── page.tsx
├── recurring-transactions
├── reset-password
│   └── page.tsx
├── services
│   ├── transaction-services.ts
│   └── transaction-services.tsx
├── sign-in
│   └── page.tsx
├── sign-up
│   └── page.tsx
├── transactions
└── types
    ├── transaction.d.ts
    └── transaction.ts
components
├── SupabaseAuthSync.tsx
├── app
│   ├── app-sidebar.tsx
│   ├── balance-dialog.tsx
│   ├── bulk-category-change.tsx
│   ├── charts
│   │   ├── bar-chart-interactive.tsx
│   │   ├── bar-chart-multiple.tsx
│   │   ├── line-chart.tsx
│   │   └── pie-donut-chart.tsx
│   ├── confirmation-dialog.tsx
│   ├── date-range-picker.tsx
│   ├── metrics-cards.tsx
│   ├── month-picker.tsx
│   ├── tables
│   │   └── transactions-table.tsx
│   ├── transaction-dialog.txt
│   ├── transaction-dialogs
│   │   ├── recurring-transactions
│   │   │   └── recurring-transaction-dialog.tsx
│   │   ├── shared
│   │   │   └── schema.ts
│   │   └── transactions
│   │       └── transaction-dialog.tsx
│   └── upload-dialog.tsx
├── auth
│   └── supabase-sync.tsx
├── providers
│   └── user-sync-provider.tsx
└── ui
    ├── alert-dialog.tsx
    ├── avatar.tsx
    ├── badge.tsx
    ├── button.tsx
    ├── calendar.tsx
    ├── card.tsx
    ├── chart.tsx
    ├── checkbox.tsx
    ├── dialog.tsx
    ├── dropdown-menu.tsx
    ├── form.tsx
    ├── input.tsx
    ├── label.tsx
    ├── pagination.tsx
    ├── popover.tsx
    ├── progress.tsx
    ├── select.tsx
    ├── separator.tsx
    ├── sheet.tsx
    ├── sidebar.tsx
    ├── skeleton.tsx
    ├── sonner.tsx
    ├── table.tsx
    ├── tabs.tsx
    ├── textarea.tsx
    ├── toast.tsx
    └── tooltip.tsx