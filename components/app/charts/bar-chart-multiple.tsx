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
  return (
    <Card className="w-full h-full">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-6">
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>Income vs Expenses</CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4 h-[300px]">
        <ChartContainer config={chartConfig} className="w-full h-full">
          {/* Use width and height as percentages to make it truly responsive */}
          <ResponsiveContainer>
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
    </Card>
  );
}