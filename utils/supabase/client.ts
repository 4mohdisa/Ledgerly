import { createBrowserClient } from '@supabase/ssr';
import { Database } from '../../database.types';

export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce' // Use PKCE flow for better security
      },
      global: {
        headers: {
          'Content-Type': 'application/json'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  );
};