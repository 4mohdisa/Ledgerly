// utils/supabase/client.ts
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