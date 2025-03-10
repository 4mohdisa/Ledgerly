"use client"

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface TransactionConverterProps {
  userId: string;
}

/**
 * A utility component that handles real-time conversion of upcoming transactions 
 * to regular transactions when their due date arrives.
 */
function TransactionConverter({ userId }: TransactionConverterProps) {
  useEffect(() => {
    const supabase = createClient();

    // Set up real-time subscription to upcoming_transactions table
    const channel = supabase
      .channel('upcoming_transactions')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'upcoming_transactions' }, 
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const transaction = payload.new;
            if (new Date(transaction.date) <= new Date()) {
              await convertToTransaction(transaction);
            }
          }
        }
      )
      .subscribe();

    // Initial check for existing past-due transactions
    checkAndConvertPastDue(userId);

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  /**
   * Converts an upcoming transaction to a regular transaction
   */
  async function convertToTransaction(upcomingTransaction: any) {
    const supabase = createClient();
    
    // Insert the upcoming transaction into the regular transactions table
    const { error: insertError } = await supabase.from('transactions').insert({
      user_id: upcomingTransaction.user_id,
      date: upcomingTransaction.date,
      amount: upcomingTransaction.amount,
      name: upcomingTransaction.name,
      description: upcomingTransaction.description,
      type: upcomingTransaction.type,
      account_type: upcomingTransaction.account_type,
      category_id: upcomingTransaction.category_id,
      category_name: upcomingTransaction.category_name,
      recurring_frequency: 'Never',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // If the transaction was successfully inserted, delete it from upcoming_transactions
    if (!insertError) {
      await supabase.from('upcoming_transactions').delete().eq('id', upcomingTransaction.id);
    } else {
      console.error('Error converting transaction:', insertError);
    }
  }

  /**
   * Checks for and converts any past-due upcoming transactions
   */
  async function checkAndConvertPastDue(userId: string) {
    const supabase = createClient();
    
    // Get all past-due upcoming transactions
    const { data: pastDue, error } = await supabase
      .from('upcoming_transactions')
      .select('*')
      .eq('user_id', Number(userId))
      .lte('date', new Date().toISOString().split('T')[0]);

    if (error) {
      console.error('Error fetching past-due transactions:', error);
      return;
    }

    // Convert each past-due transaction
    for (const transaction of pastDue || []) {
      await convertToTransaction(transaction);
    }
  }

  // This component doesn't render anything visible
  return null;
}

export default TransactionConverter;
