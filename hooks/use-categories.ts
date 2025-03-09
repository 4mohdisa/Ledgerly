import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

export interface Category {
  id: number;
  name: string;
  user_id?: string | number | null; // Support string, number, and null for compatibility
  icon?: string | null;
  color?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  description?: string | null;
  is_default?: boolean | null;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        
        // Get the current user
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          throw new Error('No active session found');
        }

        // Convert user ID from string to number if needed for database compatibility
        // This assumes your database expects a numeric user_id
        const userId = parseInt(session.user.id, 10);
        
        // Fetch categories for the user
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId)
          .order('name', { ascending: true });
          
        if (error) throw error;
        
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategories();
  }, []);

  return { categories, loading, error };
}