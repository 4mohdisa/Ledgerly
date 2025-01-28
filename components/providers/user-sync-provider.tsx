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