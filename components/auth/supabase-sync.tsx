'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { createClient } from '@/utils/supabase/client';

export const SupabaseAuthSync = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const supabase = createClient();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const syncAuth = async () => {
      try {
        const token = await getToken({ template: 'supabase' });
        if (token) {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: '',
          });
          setIsAuthenticated(true);
          console.log('Supabase auth synced successfully');
        }
      } catch (error) {
        console.error('Error syncing Supabase auth:', error);
        setIsAuthenticated(false);
      }
    };

    syncAuth();
    window.addEventListener('clerk-token-update', syncAuth);
    
    return () => {
      window.removeEventListener('clerk-token-update', syncAuth);
    };
  }, [getToken, supabase.auth]);

  // Sync profile after authentication is confirmed
  useEffect(() => {
    const syncProfile = async () => {
      if (!isAuthenticated || !user) return;

      try {
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
          console.error('Error syncing profile:', error);
        } else {
          console.log('Profile synced successfully');
        }
      } catch (error) {
        console.error('Error in profile sync:', error);
      }
    };

    syncProfile();
  }, [isAuthenticated, user, supabase]);

  return null;
};