"use client"

import * as React from "react";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
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
import { recurringTransactions } from "@/data/recurring-transactions";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))"];

// Process transactions data for the chart
const processChartData = () => {
  const categoryTotals = recurringTransactions.reduce((acc, transaction) => {
    const category = transaction.category_name;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += transaction.amount;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(categoryTotals).map(([category, value]) => ({
    category,
    value
  }));
};

const chartData = processChartData();

const chartConfig = {
  category: {
    label: "Category",
  },
  ...Object.fromEntries(
    chartData.map((item, index) => [
      item.category.toLowerCase(),
      {
        label: item.category,
        color: COLORS[index % COLORS.length],
      },
    ])
  ),
} satisfies ChartConfig;

export function PieDonutChart() {
  const totalSpending = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, []);

  return (
    <div
    >
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Spending Breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer
            config={chartConfig}
            className="mx-auto aspect-square w-full max-h-[250px]"
          >
            <ResponsiveContainer >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Pie
                  data={chartData}
                  dataKey="value"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  strokeWidth={5}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    <tspan
                      x="50%"
                      y="50%"
                      className="fill-foreground text-3xl font-bold"
                    >
                      ${totalSpending.toLocaleString()}
                    </tspan>
                    <tspan
                      x="50%"
                      y="calc(50% + 24px)"
                      className="fill-muted-foreground text-sm"
                    >
                      Total Spending
                    </tspan>
                  </text>
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
        <CardFooter className="flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 font-medium leading-none">
            Top category: {chartData[0].category}
          </div>
          <div className="leading-none text-muted-foreground">
            Showing spending distribution across categories
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
