"use client"

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAppSelector } from '@/redux/hooks';
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/format";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

// Process transactions data for the chart by month
const processMonthlyData = (transactions: any[]) => {
  // Always generate month data points, even if there are no transactions
  // This ensures we show empty charts with zero values instead of loading skeletons
  
  // Get the last 6 months
  const today = new Date();
  const sixMonthsAgo = subMonths(today, 5); // 5 months ago + current month = 6 months
  
  // Create a data point for each month in the range
  const months = eachMonthOfInterval({
    start: startOfMonth(sixMonthsAgo),
    end: endOfMonth(today)
  });
  
  // Initialize data for each month
  const monthlyData = months.map(month => ({
    month: format(month, 'MMM yyyy'),
    monthKey: format(month, 'yyyy-MM'),
    income: 0,
    expenses: 0
  }));
  
  // Add transaction amounts to the appropriate month
  transactions.forEach(transaction => {
    if (!transaction.date) return;
    
    try {
      const transactionDate = parseISO(transaction.date);
      const monthKey = format(transactionDate, 'yyyy-MM');
      
      const monthData = monthlyData.find(m => m.monthKey === monthKey);
      if (monthData) {
        if (transaction.type === 'Income') {
          monthData.income += parseFloat(String(transaction.amount)) || 0;
        } else if (transaction.type === 'Expense') {
          monthData.expenses += parseFloat(String(transaction.amount)) || 0;
        }
      }
    } catch (error) {
      console.error('Error processing transaction date:', error);
    }
  });
  
  return monthlyData;
};

const SpendingChart = () => {
  // Get transactions from Redux store
  const { items: transactions, status: transactionsStatus } = useAppSelector((state: any) => state.transactions);
  const isLoading = transactionsStatus === 'loading' || transactionsStatus === 'idle';
  
  // Process chart data
  const chartData = React.useMemo(() => {
    if (isLoading || !transactions || transactions.length === 0) {
      return [];
    }
    return processMonthlyData(transactions);
  }, [transactions, isLoading]);
  
  // Calculate trends
  const trends = React.useMemo(() => {
    if (chartData.length < 2) {
      return { income: 0, expenses: 0 };
    }
    
    const currentMonth = chartData[chartData.length - 1];
    const previousMonth = chartData[chartData.length - 2];
    
    const incomeTrend = currentMonth.income - previousMonth.income;
    const expensesTrend = currentMonth.expenses - previousMonth.expenses;
    
    return {
      income: incomeTrend,
      expenses: expensesTrend
    };
  }, [chartData]);
  
  // Only show loading state when explicitly loading, not when there's no data
  if (isLoading && transactionsStatus !== 'succeeded') {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Monthly Spending</CardTitle>
          <CardDescription>Income vs Expenses</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 h-[300px]">
          <div className="w-full h-full flex items-center justify-center">
            <Skeleton className="h-[250px] w-full rounded-md" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // We'll always show the chart, even with zero values
  // The chart will display empty bars when there's no data
  
  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Monthly Spending</CardTitle>
        <CardDescription>Income vs Expenses</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-sm text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              className="text-sm text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Month
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {label}
                          </span>
                        </div>
                        {payload.map((entry, index) => (
                          <div key={`item-${index}`} className="flex flex-col">
                            <span
                              className="text-[0.70rem] uppercase text-muted-foreground"
                              style={{ color: entry.color }}
                            >
                              {entry.name === "income" ? "Income" : "Expenses"}
                            </span>
                            <span className="font-bold" style={{ color: entry.color }}>
                              {formatCurrency(Number(entry.value))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="income" name="Income" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex items-center gap-2">
          {trends.income >= 0 ? (
            <>
              <TrendingUp className="text-green-500" size={16} />
              <span className="text-sm font-medium">Income {trends.income > 0 ? 'up' : 'unchanged'}</span>
            </>
          ) : (
            <>
              <TrendingDown className="text-red-500" size={16} />
              <span className="text-sm font-medium">Income down</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {trends.expenses <= 0 ? (
            <>
              <TrendingDown className="text-green-500" size={16} />
              <span className="text-sm font-medium">Expenses {trends.expenses < 0 ? 'down' : 'unchanged'}</span>
            </>
          ) : (
            <>
              <TrendingUp className="text-red-500" size={16} />
              <span className="text-sm font-medium">Expenses up</span>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default SpendingChart;
