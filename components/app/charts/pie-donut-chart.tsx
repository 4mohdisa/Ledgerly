"use client"

import React from "react";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { PieChart as PieChartIcon } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChartTooltip } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from '@/redux/hooks';
import { formatCurrency } from "@/utils/format";

// Chart color palette
const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))"];

// Process transactions data for the chart
const processChartData = (transactions) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  const categoryTotals = transactions.reduce((acc, transaction) => {
    const category = transaction.category_name || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(transaction.amount) || 0;
    return acc;
  }, {});

  return Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0) // Filter out zero values
    .map(([category, value]) => ({
      category,
      value
    }))
    .sort((a, b) => b.value - a.value); // Sort by value descending
};

function PieDonutChart() {
  const { items: transactions, status: transactionsStatus } = useAppSelector((state) => state.transactions);
  const isLoading = transactionsStatus === 'loading' || transactionsStatus === 'idle';
  
  // Process chart data
  const chartData = React.useMemo(() => {
    // If loading or no transactions, return empty array
    if (isLoading || !transactions || transactions.length === 0) {
      return [];
    }
    return processChartData(transactions);
  }, [transactions, isLoading]);
  
  // Calculate total spending
  const totalSpending = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  // Only show loading skeleton when explicitly loading, not when there's no data
  if (isLoading) {
    return (
      <Card className="w-full h-full shadow-sm">
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Spending Breakdown</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-[250px]">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const hasData = chartData.length > 0 && totalSpending > 0;

  return (
    <Card className="w-full h-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
        <CardDescription>Spending Breakdown</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-[250px] text-center">
            <div className="rounded-full bg-muted/30 w-24 h-24 mb-4 flex items-center justify-center">
              <PieChartIcon className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground font-medium">No spending data yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add transactions to see your spending breakdown</p>
          </div>
        ) : (
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                      {formatCurrency(totalSpending)}
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
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Category
                              </span>
                              <span className="font-bold">
                                {data.category}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Amount
                              </span>
                              <span className="font-bold">{formatCurrency(data.value)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
      {hasData && (
        <CardFooter className="flex-col gap-2 text-sm p-6 pt-0">
          <div className="flex items-center gap-2 font-medium leading-none">
            Top category: {chartData[0].category}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 w-full">
            {chartData.slice(0, 3).map((item, index) => (
              <div key={item.category} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="text-xs font-medium truncate">{item.category}</div>
              </div>
            ))}
          </div>
        </CardFooter>
      )}
    </Card>
  );
}

export default PieDonutChart;
