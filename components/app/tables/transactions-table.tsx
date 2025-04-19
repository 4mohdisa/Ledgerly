"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDownIcon, ChevronUpIcon, CreditCard, PlusIcon, Trash2Icon, EditIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { formatCurrency, formatDate } from "@/utils/format";
import { deleteTransaction } from "@/redux/slices/transactionsSlice";
import { TransactionDialog } from "@/components/app/transaction-dialogs/transactions/transaction-dialog";
import { Badge } from "@/components/ui/badge";
import { DateRange } from "react-day-picker";

// Define transaction interface
interface Transaction {
  id: string;
  name: string;
  amount: number;
  date: string;
  type: 'Income' | 'Expense';
  category_id?: string;
  category_name?: string;
  account_id?: string;
  account_name?: string;
  description?: string;
  user_id?: string;
}

// Define sort functionality
interface SortState {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

function useSortTable(data: any[], defaultSortKey: string, defaultDirection: 'asc' | 'desc' = 'desc') {
  const [sort, setSort] = React.useState<SortState>({
    sortBy: defaultSortKey,
    sortDirection: defaultDirection
  });

  const toggleSort = (key: string) => {
    if (sort.sortBy === key) {
      setSort({
        sortBy: key,
        sortDirection: sort.sortDirection === 'asc' ? 'desc' : 'asc'
      });
    } else {
      setSort({
        sortBy: key,
        sortDirection: 'asc'
      });
    }
  };

  const sortedData = React.useMemo(() => {
    if (!data || !data.length) return [];
    
    return [...data].sort((a, b) => {
      const aVal = a[sort.sortBy];
      const bVal = b[sort.sortBy];
      
      // Handle null or undefined values
      if (aVal == null) return sort.sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return sort.sortDirection === 'asc' ? 1 : -1;
      
      // Handle different types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sort.sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      } else {
        const numA = Number(aVal);
        const numB = Number(bVal);
        return sort.sortDirection === 'asc' ? numA - numB : numB - numA;
      }
    });
  }, [data, sort.sortBy, sort.sortDirection]);

  return {
    data: sortedData,
    sortBy: sort.sortBy,
    sortDirection: sort.sortDirection,
    toggleSort
  };
}

interface TransactionsTableProps {
  loading?: boolean;
  data?: Transaction[];
  showFilters?: boolean;
  showPagination?: boolean;
  showRowsCount?: boolean;
  itemsPerPage?: number;
  sortBy?: { field: string; order: string };
  className?: string;
  dateRange?: DateRange;
  type?: string;
  onDelete?: (id: number) => Promise<void>;
  onEdit?: (id: any, data: any) => void;
  // Support for bulk operations
  onBulkDelete?: (ids: number[]) => Promise<void>;
  onBulkEdit?: (ids: number[], changes: any) => Promise<void>;
  // New props for enhanced flexibility
  title?: string; // Custom table title
  description?: string; // Custom table description
  showAddButton?: boolean; // Whether to show the Add New button
  customEmptyState?: React.ReactNode; // Custom empty state content
}

export function TransactionsTable(props: TransactionsTableProps = {}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { items: reduxTransactions, status: transactionsStatus } = useAppSelector((state) => state.transactions);
  
  // Use props.data if provided, otherwise use redux state
  const transactionsData = props.data || reduxTransactions || [];
  
  // Use props.loading if provided, otherwise use redux state
  const isLoading = props.loading !== undefined 
    ? props.loading 
    : transactionsStatus === 'loading' || transactionsStatus === 'idle';

  // State for dialogs and editing
  const [showAddDialog, setShowAddDialog] = React.useState(false);
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  
  // Use custom sort hook for table
  const { 
    data: sortedTransactions, 
    sortBy, 
    toggleSort,
    sortDirection
  } = useSortTable(
    transactionsData, 
    props.sortBy?.field || 'date', 
    (props.sortBy?.order as 'asc' | 'desc') || 'desc'
  );
  
  // Handle dialogs
  const handleAddNew = () => {
    setShowAddDialog(true);
  };
  
  const handleEdit = (transaction: Transaction) => {
    if (props.onEdit) {
      props.onEdit(transaction.id, transaction);
    } else {
      setSelectedTransaction(transaction);
      setShowEditDialog(true);
    }
  };
  
  const handleDelete = (transaction: Transaction) => {
    if (props.onDelete && transaction.id) {
      props.onDelete(parseInt(transaction.id));
    } else {
      dispatch(deleteTransaction({ id: parseInt(transaction.id), userId: transaction.user_id || '' }));
    }
  };
  
  // Render arrow based on sort direction
  const renderSortArrow = (column: string) => {
    if (sortBy !== column) return null;
    
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="ml-1 h-4 w-4" />
      : <ChevronDownIcon className="ml-1 h-4 w-4" />;
  };
  
  // Format transaction item for display
  const renderTransactionItem = (transaction: Transaction) => {
    const categoryColors: Record<string, string> = {
      'Housing': 'bg-blue-100 text-blue-800',
      'Food': 'bg-green-100 text-green-800',
      'Transportation': 'bg-yellow-100 text-yellow-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Health': 'bg-red-100 text-red-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Personal': 'bg-indigo-100 text-indigo-800',
      'Income': 'bg-emerald-100 text-emerald-800',
      'Utilities': 'bg-cyan-100 text-cyan-800',
      'Travel': 'bg-amber-100 text-amber-800',
      'Education': 'bg-lime-100 text-lime-800',
      'Business': 'bg-sky-100 text-sky-800',
      'Groceries': 'bg-teal-100 text-teal-800',
      'Dining': 'bg-orange-100 text-orange-800',
    };
    
    const categoryName = transaction.category_name || 'Uncategorized';
    const categoryColor = categoryName in categoryColors 
      ? categoryColors[categoryName]
      : 'bg-gray-100 text-gray-800';
      
    return (
      <TableRow key={transaction.id}>
        <TableCell>{formatDate(transaction.date)}</TableCell>
        <TableCell className="font-medium">{transaction.name}</TableCell>
        <TableCell>
          <Badge className={`${categoryColor}`}>
            {categoryName}
          </Badge>
        </TableCell>
        <TableCell className={transaction.type === 'Income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {transaction.type === 'Income' ? '+' : '-'}{formatCurrency(transaction.amount)}
        </TableCell>
        <TableCell>
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleEdit(transaction)}
            >
              <EditIcon className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => handleDelete(transaction)}
            >
              <Trash2Icon className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  };
  
  // Skeleton loader for loading state
  if (isLoading) {
    return (
      <Card className="w-full shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array(5).fill(0).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Empty state
  const hasTransactions = sortedTransactions && sortedTransactions.length > 0;
  
  return (
    <>
      <Card className={`w-full shadow-sm hover:shadow-md transition-shadow duration-200 ${props.className || ''}`}>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>{props.title || 'Recent Transactions'}</CardTitle>
            <CardDescription>{props.description || 'Your latest financial activity'}</CardDescription>
          </div>
          {props.showAddButton !== false && (
            <Button onClick={handleAddNew} size="sm">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add New
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('date')}
                  >
                    <div className="flex items-center">
                      Date {renderSortArrow('date')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('name')}
                  >
                    <div className="flex items-center">
                      Name {renderSortArrow('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('category_name')}
                  >
                    <div className="flex items-center">
                      Category {renderSortArrow('category_name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => toggleSort('amount')}
                  >
                    <div className="flex items-center">
                      Amount {renderSortArrow('amount')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!hasTransactions ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-[300px] text-center">
                      {props.customEmptyState ? (
                        props.customEmptyState
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="rounded-full bg-muted/30 w-16 h-16 mb-4 flex items-center justify-center">
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <p className="text-muted-foreground font-medium">No transactions yet</p>
                          <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first transaction to get started</p>
                          {props.showAddButton !== false && (
                            <Button onClick={handleAddNew} size="sm" variant="outline">
                              <PlusIcon className="mr-2 h-4 w-4" />
                              Add Transaction
                            </Button>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedTransactions.map(renderTransactionItem)
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        {hasTransactions && props.showRowsCount !== false && (
          <CardFooter className="flex justify-between p-4">
            <div className="text-sm text-muted-foreground">
              Showing {sortedTransactions.length} transactions
            </div>
            {!props.type && (
              <Button variant="outline" size="sm" onClick={() => router.push('/transactions')}>
                View All
              </Button>
            )}
          </CardFooter>
        )}
      </Card>
      
      {/* Dialogs */}
      {showAddDialog && (
        <TransactionDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          mode="create"
        />
      )}
      
      {showEditDialog && selectedTransaction && (
        <TransactionDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          mode="edit"
          initialData={{
            name: selectedTransaction.name,
            amount: selectedTransaction.amount,
            type: selectedTransaction.type as any,
            date: new Date(selectedTransaction.date),
            category_id: selectedTransaction.category_id || '',
            description: selectedTransaction.description || ''
          }}
        />
      )}
    </>
  );
}
