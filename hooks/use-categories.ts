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

        // Fetch categories for the user - try both string and number user_id
        const userId = session.user.id;
        
        // Try to fetch with string user_id first
        let { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', userId as any)
          .order('name', { ascending: true });
        
        if (error) {
          console.error('Error fetching categories with string ID:', error);
          
          // Try with numeric user_id as fallback
          const numericUserId = parseInt(userId, 10);
          if (!isNaN(numericUserId)) {
            const result = await supabase
              .from('categories')
              .select('*')
              .eq('user_id', numericUserId as any)
              .order('name', { ascending: true });
            
            data = result.data;
            error = result.error;
          }
        }
        
        if (error) throw error;
        
        setCategories(data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
        
        // Set empty categories array on error to prevent UI issues
        setCategories([]);
      } finally {
        setLoading(false);
      }
    }
    
    fetchCategories();
  }, []);

  return { categories, loading, error };
}
