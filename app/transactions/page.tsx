"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRangePickerWithRange } from "@/components/app/date-range-picker"
import { DataTable } from './data-table'
import { columns } from './columns'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Plus, FileDown, Trash2 } from 'lucide-react'
import { DateRange } from "react-day-picker"
import { AppSidebar } from '@/components/app/app-sidebar'

// Mock data for transactions
const transactions = [
  { id: 1, date: '2023-05-01', amount: 100, name: 'Grocery Shopping', type: 'Expense', category: 'Food', account: 'Checking' },
  { id: 2, date: '2023-05-02', amount: 2000, name: 'Salary', type: 'Income', category: 'Salary', account: 'Savings' },
  { id: 3, date: '2023-05-03', amount: 50, name: 'Gas', type: 'Expense', category: 'Transportation', account: 'Credit Card' },
  // Add more mock transactions as needed
]

export default function TransactionsPage() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [selectedTransactions, setSelectedTransactions] = useState<number[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0)
  const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0)
  const netBalance = totalIncome - totalExpenses

  const handleAddTransaction = () => {
    setIsAddTransactionOpen(true)
  }

  const handleExportTransactions = () => {
    // Implement CSV export logic here
    console.log('Exporting transactions...')
  }

  const handleDeleteSelected = () => {
    // Implement delete logic here
    console.log('Deleting selected transactions:', selectedTransactions)
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range)
    // Implement filtering logic here
    console.log('Date range changed:', range)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="w-64 flex-shrink-0">
        <AppSidebar />
      </div>

      <h1 className="text-3xl font-bold mb-6">Transactions</h1>

      {/* Transaction Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <Badge variant="destructive">${totalExpenses.toFixed(2)}</Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <Badge variant="default">${totalIncome.toFixed(2)}</Badge>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
            <Badge variant={netBalance >= 0 ? "success" : "destructive"}>${netBalance.toFixed(2)}</Badge>
          </CardHeader>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <DateRangePickerWithRange onDateRangeChange={handleDateRangeChange} />
        <Select>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="food">Food</SelectItem>
            <SelectItem value="transportation">Transportation</SelectItem>
            <SelectItem value="salary">Salary</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
            <SelectItem value="income">Income</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Account" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Accounts</SelectItem>
            <SelectItem value="checking">Checking</SelectItem>
            <SelectItem value="savings">Savings</SelectItem>
            <SelectItem value="credit">Credit Card</SelectItem>
          </SelectContent>
        </Select>
        <Input className="w-full md:w-auto" placeholder="Search transactions..." />
      </div>

      {/* Bulk Actions */}
      <div className="flex justify-between items-center mb-4">
        <div className="space-x-2">
          <Button onClick={handleAddTransaction}>
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
          <Button variant="outline" onClick={handleExportTransactions}>
            <FileDown className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={selectedTransactions.length === 0}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Selected
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the selected transactions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteSelected}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Transactions Table */}
      {transactions.length > 0 ? (
        <DataTable columns={columns} data={transactions} />
      ) : (
        <Card className="text-center p-6">
          <CardContent>
            <p className="text-lg mb-4">No transactions found. Start by adding your first transaction!</p>
            <Button onClick={handleAddTransaction}>Add Transaction</Button>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Enter the details of your new transaction here.
            </DialogDescription>
          </DialogHeader>
          {/* Add your transaction form here */}
          {/* This is where you would implement the form following the Shadcn Popup Form for Adding Manual Transactions */}
        </DialogContent>
      </Dialog>
    </div>
  )
}

