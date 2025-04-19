'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

export const SupabaseAuthSync = () => {
  const supabase = createClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {

      } else if (event === 'SIGNED_OUT') {

      } else if (event === 'USER_UPDATED') {

      } else if (event === 'PASSWORD_RECOVERY') {
        toast.info('Password recovery email sent', {
          description: 'Check your email for the password reset link',
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  return null;
};