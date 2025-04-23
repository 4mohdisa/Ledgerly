"use client"

import * as React from "react"
import { ArrowUpCircle, ArrowDownCircle, DollarSign, PieChart } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format"
import { useAppSelector } from "@/redux/hooks"

const MetricCard = React.memo(({ title, value, icon: Icon, color, onClick }: {
  title: string
  value: number | string
  icon: any
  color: string
  onClick?: () => void
}) => (
  <Card className="relative" onClick={onClick}>
    <CardHeader>
      <CardTitle className="flex items-center text-lg font-semibold">
        <Icon className={`w-5 h-5 mr-2 ${color}`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight">
        {value}
      </div>
    </CardContent>
  </Card>
))

MetricCard.displayName = 'MetricCard'

export const MetricsCards = React.memo(function MetricsCards() {
  // Get transactions from Redux store
  const { items: transactions, status: transactionsStatus } = useAppSelector((state: any) => state.transactions)
  // Only consider loading if explicitly in loading state, not when there's no data
  const isLoading = transactionsStatus === 'loading'
  
  // Calculate real metrics from transaction data
  const metrics = React.useMemo(() => {
    // Always return actual values (zeros) instead of loading state
    // This ensures we show zero analytics when there's no data
    if (!transactions || transactions.length === 0) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        topCategory: "None",
      }
    }
    
    // Calculate income and expenses
    const income = transactions
      .filter((t: any) => t.type === 'Income')
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0)
      
    const expenses = transactions
      .filter((t: any) => t.type === 'Expense')
      .reduce((sum: number, t: any) => sum + (parseFloat(t.amount) || 0), 0)
    
    // Calculate top category
    const categoryMap: Record<string, number> = {}
    transactions.forEach((t: any) => {
      const category = t.category_name || 'Uncategorized'
      if (!categoryMap[category]) {
        categoryMap[category] = 0
      }
      categoryMap[category] += parseFloat(t.amount) || 0
    })
    
    let topCategory = "None"
    let maxAmount = 0
    Object.entries(categoryMap).forEach(([category, amount]) => {
      if (amount > maxAmount) {
        maxAmount = amount
        topCategory = category
      }
    })
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netBalance: income - expenses,
      topCategory,
    }
  }, [transactions, isLoading])

  const cards = React.useMemo(() => [
    { title: "Total Income", value: metrics.totalIncome, icon: ArrowUpCircle, color: "text-green-500" },
    { title: "Total Expenses", value: metrics.totalExpenses, icon: ArrowDownCircle, color: "text-red-500" },
    { title: "Net Balance", value: metrics.netBalance, icon: DollarSign, color: "text-blue-500"},
    { title: "Top Category", value: metrics.topCategory, icon: PieChart, color: "text-purple-500" },
  ], [metrics])

  // Only show loading skeletons when explicitly in loading state and not when there's no data
  // This prevents showing loading skeletons indefinitely
  if (isLoading && transactionsStatus !== 'succeeded') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative">
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((item) => (
        <MetricCard
          key={item.title}
          title={item.title}
          value={typeof item.value === 'number' && item.title !== 'Top Category' ? formatCurrency(item.value) : item.value}
          icon={item.icon}
          color={item.color}
        />
      ))}
    </div>
  )
})
