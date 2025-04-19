'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Transaction } from '@/app/types/transaction'
import { DateRange } from 'react-day-picker'
import { useAuth } from '@/context/auth-context'
import { RealtimeChannel } from '@supabase/supabase-js'

type TransactionResponse = Transaction

export function useTransactions(dateRange?: DateRange) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { user } = useAuth()
  const supabase = createClient()

  // Function to manually trigger a refresh
  const refresh = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  // Fetch transactions when component mounts or when dependencies change
  useEffect(() => {
    let subscription: RealtimeChannel | null = null

    async function fetchTransactions() {
      if (!user?.id) return

      try {

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


        setTransactions((data || []) as Transaction[])
      } catch (err) {
        console.error('Error fetching transactions:', err)
        setError(err instanceof Error ? err : new Error('Failed to fetch transactions'))
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()

    // Set up real-time subscription to transactions table
    if (user?.id) {
      // Enable real-time subscription for the transactions table
      subscription = supabase
        .channel('transactions-changes')
        .on('postgres_changes', {
          event: '*', // Listen for all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}` // Only listen for changes to this user's transactions
        }, () => {

          refresh() // Refresh the transactions list when a change is detected
        })
        .subscribe()


    }

    // Clean up subscription when component unmounts or dependencies change
    return () => {
      if (subscription) {

        supabase.removeChannel(subscription)
      }
    }
  }, [supabase, user?.id, dateRange?.from, dateRange?.to, refreshTrigger])

  return { transactions, loading, error, refresh }
}
