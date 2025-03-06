'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Transaction } from '@/app/types/transaction'
import { DateRange } from 'react-day-picker'
import { useAuth } from '@/context/auth-context'

type TransactionResponse = Transaction

export function useTransactions(dateRange?: DateRange) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    async function fetchTransactions() {
      if (!user?.id) return

      try {
        console.log('Fetching transactions with date range:', dateRange)
        let query = supabase
          .from('transactions')
          .select(`
            *,
            categories (
              name
            )
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false })

        if (dateRange?.from) {
          query = query.gte('date', dateRange.from.toISOString().split('T')[0])
        }
        if (dateRange?.to) {
          query = query.lte('date', dateRange.to.toISOString().split('T')[0])
        }

        const { data, error } = await query as { data: TransactionResponse[] | null, error: any }

        if (error) {
          throw error
        }

        console.log('Fetched transactions:', data)
        setTransactions((data || []) as Transaction[])
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch transactions'))
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [supabase, user?.id, dateRange?.from, dateRange?.to])

  return { transactions, loading, error }
}
