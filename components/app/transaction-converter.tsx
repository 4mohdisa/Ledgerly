"use client"

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { transactionService } from '@/app/services/transaction-services';
import { toast } from 'sonner';

interface TransactionConverterProps {
  userId: string;
}

/**
 * A utility component that handles real-time conversion of upcoming transactions 
 * to regular transactions when their due date arrives.
 */
function TransactionConverter({ userId }: TransactionConverterProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    // Process transactions immediately when the component mounts
    processTransactions();
    
    // Set up an interval to check for past-due transactions periodically
    const interval = setInterval(() => {
      processTransactions();
    }, 60000); // Check every minute
    
    return () => {
      clearInterval(interval);
    };
  }, [userId]);

  async function processTransactions() {
    if (isProcessing || !userId) return;
    
    try {
      setIsProcessing(true);
      await transactionService.convertPastDueTransactions(userId);
      
      // Only regenerate if we've processed past due transactions
      await transactionService.generateUpcomingTransactions(userId);
    } catch (error) {
      console.error('Error processing transactions:', error);
      toast.error('Failed to process due transactions');
    } finally {
      setIsProcessing(false);
    }
  }

  // This component doesn't render anything visible
  return null;
}

export default TransactionConverter;