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
import { transactions } from "@/data/transactions"

interface DailyBalance {
  date: string
  balance: number
}

// Process transactions data for the chart
const processTransactions = (): DailyBalance[] => {
  const dailyNetBalance: { [key: string]: number } = {}
  
  transactions.forEach(transaction => {
    const date = transaction.date // Already in YYYY-MM-DD format
    if (!dailyNetBalance[date]) {
      dailyNetBalance[date] = 0
    }
    dailyNetBalance[date] += transaction.type === "Income" ? transaction.amount : -transaction.amount
  })

  return Object.entries(dailyNetBalance)
    .map(([date, balance]) => ({ date, balance }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

const chartData = processTransactions()

const chartConfig = {
  balance: {
    label: "Net Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)

export function NetBalanceChart() {
  const minBalance = Math.min(...chartData.map(d => d.balance))
  const maxBalance = Math.max(...chartData.map(d => d.balance))

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
                tickFormatter={(value) => formatCurrency(value)}
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
                    formatter={(value) => formatCurrency(value)}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="hsl(var(--chart-1))"
                strokeWidth={2}
                dot={{
                  r: 4,
                  fill: "hsl(var(--chart-1))",
                  stroke: "hsl(var(--chart-1))",
                  strokeWidth: 2,
                }}
                dotProps={{
                  fill: (props: { payload: DailyBalance }) => 
                    props.payload.balance >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
