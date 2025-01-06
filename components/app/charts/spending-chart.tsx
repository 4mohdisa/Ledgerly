"use client"

import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

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
    <Card>
      <CardHeader>
        <CardTitle>Monthly Spending</CardTitle>
        <CardDescription>Income vs Expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey="income" fill="var(--color-income)" />
            <Bar dataKey="expenses" fill="var(--color-expenses)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
