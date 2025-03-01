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
