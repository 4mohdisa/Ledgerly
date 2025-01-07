"use client"

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from 'lucide-react';

const chartData = [
  { month: "January", income: 4000, expenses: 2400 },
  { month: "February", income: 3000, expenses: 1398 },
  { month: "March", income: 2000, expenses: 9800 },
  { month: "April", income: 2780, expenses: 3908 },
  { month: "May", income: 1890, expenses: 4800 },
  { month: "June", income: 2390, expenses: 3800 },
  { month: "July", income: 3490, expenses: 4300 },
];

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

export function SpendingChart() {
  const latestMonth = chartData[chartData.length - 1];
  const previousMonth = chartData[chartData.length - 2];
  const incomeChange = ((latestMonth.income - previousMonth.income) / previousMonth.income) * 100;
  const expensesChange = ((latestMonth.expenses - previousMonth.expenses) / previousMonth.expenses) * 100;

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Monthly Spending</CardTitle>
        <CardDescription>Income vs Expenses</CardDescription>
      </CardHeader>
      <CardContent className="pt-4 h-[300px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dashed" />}
              />
              <Bar dataKey="income" fill="var(--color-income)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex justify-between w-full">
          <div className="flex items-center gap-2 font-medium">
            Income: {incomeChange >= 0 ? (
              <span className="text-green-600 flex items-center">
                +{incomeChange.toFixed(1)}% <TrendingUp className="h-4 w-4 ml-1" />
              </span>
            ) : (
              <span className="text-red-600 flex items-center">
                {incomeChange.toFixed(1)}% <TrendingDown className="h-4 w-4 ml-1" />
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 font-medium">
            Expenses: {expensesChange >= 0 ? (
              <span className="text-red-600 flex items-center">
                +{expensesChange.toFixed(1)}% <TrendingUp className="h-4 w-4 ml-1" />
              </span>
            ) : (
              <span className="text-green-600 flex items-center">
                {expensesChange.toFixed(1)}% <TrendingDown className="h-4 w-4 ml-1" />
              </span>
            )}
          </div>
        </div>
        <div className="text-muted-foreground">
          Comparing {chartData[chartData.length - 1].month} to {chartData[chartData.length - 2].month}
        </div>
      </CardFooter>
    </Card>
  );
}

