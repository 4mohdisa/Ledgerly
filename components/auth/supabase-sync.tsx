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