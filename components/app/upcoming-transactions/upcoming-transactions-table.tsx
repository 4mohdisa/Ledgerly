import React from 'react';
import { format } from 'date-fns';
import { Transaction } from '@/app/types/transaction';
import { useAppSelector } from '@/redux/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/utils/format';
import { Badge } from '@/components/ui/badge';
import { TransactionRowSkeleton } from '../skeletons/transaction-row-skeleton';

interface UpcomingTransactionsTableProps {
  limit?: number;
}

export function UpcomingTransactionsTable({ limit = 5 }: UpcomingTransactionsTableProps) {
  const { upcomingTransactions, upcomingStatus } = useAppSelector(state => state.recurringTransactions);
  const isLoading = upcomingStatus === 'loading' || upcomingStatus === 'idle';

  // Display only the first 'limit' transactions
  const displayedTransactions = upcomingTransactions.slice(0, limit);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Upcoming Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <TransactionRowSkeleton key={index} />
            ))}
          </div>
        ) : displayedTransactions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTransactions.map((transaction: Transaction, index: number) => (
                <TableRow key={index}>
                  <TableCell>
                    {format(new Date(transaction.date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{transaction.name}</TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={transaction.type === 'Income' ? 'outline' : 'destructive'}
                      className={transaction.type === 'Income' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.category_name || 'Uncategorized'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No upcoming transactions found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
