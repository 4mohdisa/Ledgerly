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

const chartConfig = {
  balance: {
    label: "Net Balance",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function NetBalanceChart() {
  // Use useRef to track component mounted state
  const isMounted = React.useRef(true);
  const [chartData, setChartData] = React.useState(() => processTransactions());
  const minBalance = Math.min(...chartData.map(d => d.balance));
  const maxBalance = Math.max(...chartData.map(d => d.balance));
  
  // Add cleanup effect to prevent memory leaks and disconnection errors
  React.useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);

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
          {/* Use width and height as percentages to make it truly responsive */}
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
                // Use activeDot with a function to determine color based on balance value
                activeDot={(props: any) => {
                  const fillColor = props.payload.balance >= 0 
                    ? "hsl(var(--success))" 
                    : "hsl(var(--destructive))";
                  return (
                    <circle
                      key={`dot-balance-${props.index}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={4}
                      fill={fillColor}
                      stroke={fillColor}
                      strokeWidth={2}
                    />
                  );
                }}
                // Use a simple dot object instead of a function to avoid TypeScript errors
                dot={{
                  r: 2,
                  strokeWidth: 1,
                  // We'll use the activeDot for custom coloring instead
                  fill: "hsl(var(--chart-1))",
                  stroke: "hsl(var(--chart-1))"
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}