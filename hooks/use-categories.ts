'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

export interface Category {
  id: number
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  is_default?: boolean | null
  user_id?: number | null
  created_at?: string | null
  updated_at?: string | null
}

export function useCategories() {
  console.log('useCategories hook initialized');
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCategories() {
      console.log('Fetching categories...');
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (error) {
          throw error
        }

        console.log('Categories fetched:', data);
        setCategories(data || [])
      } catch (err) {
        console.log('Error fetching categories:', err);
        console.error('Error fetching categories:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch categories'))
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [supabase])

  return { categories, loading, error }
}
