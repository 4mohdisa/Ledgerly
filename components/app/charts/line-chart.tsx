"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { useAppSelector } from '@/redux/hooks'
import { Skeleton } from "@/components/ui/skeleton"
import { format, parseISO, subDays } from 'date-fns'

interface DailyBalance {
  date: string
  balance: number
}

// Process transactions data for the chart
const processTransactions = (transactions: any[]): DailyBalance[] => {
  if (!transactions || transactions.length === 0) {
    // Return empty data with the last 7 days if no transactions
    const emptyData: DailyBalance[] = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i)
      emptyData.push({
        date: format(date, 'yyyy-MM-dd'),
        balance: 0
      })
    }
    
    return emptyData
  }
  
  const dailyNetBalance: { [key: string]: number } = {}
  
  transactions.forEach(transaction => {
    const date = transaction.date // Already in YYYY-MM-DD format
    if (!dailyNetBalance[date]) {
      dailyNetBalance[date] = 0
    }
    dailyNetBalance[date] += transaction.type.toLowerCase() === "income" ? parseFloat(transaction.amount) : -parseFloat(transaction.amount)
  })

  return Object.entries(dailyNetBalance)
    .map(([date, balance]) => ({ date, balance }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

const chartConfig = {
  balance: {
    label: "Net Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

function NetBalanceChart() {
  // Get transactions from Redux store
  const { items: transactions, status: transactionsStatus } = useAppSelector((state: any) => state.transactions);
  const isLoading = transactionsStatus === 'loading';
  
  // Process the data
  const chartData = React.useMemo(() => {
    return processTransactions(transactions || []);
  }, [transactions]);
  
  const minBalance = chartData.length > 0 ? Math.min(...chartData.map(d => d.balance)) : 0;
  const maxBalance = chartData.length > 0 ? Math.max(...chartData.map(d => d.balance)) : 0;

  return (
    <Card className="col-span-3 w-full">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-6">
        <CardTitle>Net Balance Over Time</CardTitle>
        <CardDescription>
          Tracking daily net balance (income minus expenses)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-[16/9] w-full"
        >
          <ResponsiveContainer>
            <LineChart
              data={chartData}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value: number) => formatCurrency(value)}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="w-[200px]"
                    nameKey="balance"
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }}
                    formatter={(value: any) => formatCurrency(value as number)}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={(props: any) => {
                  const fillColor = props.payload.balance >= 0 
                    ? "hsl(var(--success))" 
                    : "hsl(var(--destructive))";
                  return (
                    <circle
                      key={`dot-${props.dataKey}-${props.index}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={fillColor}
                      stroke={fillColor}
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default NetBalanceChart;
