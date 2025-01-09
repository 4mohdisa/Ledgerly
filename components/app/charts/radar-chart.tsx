"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown } from 'lucide-react'
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { categories } from "@/data/categories"

interface CategorySpending {
  [categoryId: string]: {
    [monthYear: string]: number
  }
}

interface MonthlySpending {
  [monthYear: string]: number
}

// Process transactions data for the chart
const processTransactions = (): { categorySpending: CategorySpending; monthlySpending: MonthlySpending } => {
  const categorySpending: CategorySpending = {}
  const monthlySpending: MonthlySpending = {}

  transactions.forEach(transaction => {
    if (transaction.type === "Expense") {
      const date = new Date(transaction.date)
      const month = date.toLocaleString('default', { month: 'long' })
      const year = date.getFullYear()
      const monthYear = `${month} ${year}`

      if (!categorySpending[transaction.category_id]) {
        categorySpending[transaction.category_id] = {}
      }
      if (!categorySpending[transaction.category_id][monthYear]) {
        categorySpending[transaction.category_id][monthYear] = 0
      }
      categorySpending[transaction.category_id][monthYear] += transaction.amount

      if (!monthlySpending[monthYear]) {
        monthlySpending[monthYear] = 0
      }
      monthlySpending[monthYear] += transaction.amount
    }
  })

  return { categorySpending, monthlySpending }
}

const { categorySpending, monthlySpending } = processTransactions()

const chartData = Object.entries(categorySpending).map(([categoryId, monthlyData]) => {
  const category = categories.find(c => c.id === parseInt(categoryId))
  return {
    category: category ? category.name : 'Unknown',
    ...monthlyData
  }
})

const months = Object.keys(monthlySpending)

const chartConfig = Object.fromEntries(
  months.map((month, index) => [
    month,
    {
      label: month,
      color: `hsl(${(index * 30) % 360}, 70%, 50%)`,
    }
  ])
) satisfies ChartConfig

export function SpendingRadarChart() {
  const totalSpending = useMemo(() => 
    Object.values(monthlySpending).reduce((sum, amount) => sum + amount, 0),
    [monthlySpending]
  )

  const spendingTrend = useMemo(() => {
    const sortedMonths = Object.keys(monthlySpending).sort((a, b) => new Date(a) - new Date(b))
    const lastMonth = sortedMonths[sortedMonths.length - 1]
    const previousMonth = sortedMonths[sortedMonths.length - 2]
    const trend = ((monthlySpending[lastMonth] - monthlySpending[previousMonth]) / monthlySpending[previousMonth]) * 100
    return trend.toFixed(1)
  }, [monthlySpending])

  return (
    <Card className="w-full">
      <CardHeader className="items-center">
        <CardTitle>Spending Distribution by Category</CardTitle>
        <CardDescription>
          Comparing monthly expenses across categories
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-h-[350px]"
        >
          <RadarChart data={chartData} outerRadius={90}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="category" />
            <PolarGrid />
            {months.map((month, index) => (
              <Radar
                key={month}
                name={month}
                dataKey={month}
                stroke={chartConfig[month].color}
                fill={chartConfig[month].color}
                fillOpacity={0.2}
                dot={{
                  r: 3,
                  fill: chartConfig[month].color,
                  strokeWidth: 0,
                }}
              />
            ))}
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {parseFloat(spendingTrend) > 0 ? (
            <>
              Trending up by {spendingTrend}% this month <TrendingUp className="h-4 w-4 text-red-500" />
            </>
          ) : (
            <>
              Trending down by {Math.abs(parseFloat(spendingTrend))}% this month <TrendingDown className="h-4 w-4 text-green-500" />
            </>
          )}
        </div>
        <div className="flex items-center gap-2 leading-none text-muted-foreground">
          Total Spending: ${totalSpending.toFixed(2)}
        </div>
      </CardFooter>
    </Card>
  )
}
