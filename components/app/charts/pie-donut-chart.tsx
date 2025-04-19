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
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useAppSelector } from '@/redux/hooks';
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/utils/format";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-6))"];

// Process transactions data for the chart
const processChartData = (transactions: any[]) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }
  
  const categoryTotals = transactions.reduce((acc: Record<string, number>, transaction) => {
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
    }));
};

const PieDonutChart = () => {
  // Get transactions from Redux store
  const { items: transactions, status: transactionsStatus } = useAppSelector((state: any) => state.transactions);
  const isLoading = transactionsStatus === 'loading' || transactionsStatus === 'idle';
  
  // Process chart data
  const chartData = React.useMemo(() => {
    // If loading, return empty array
    if (isLoading) {
      return [];
    }
    
    // If no transactions, return default empty data with one category
    if (!transactions || transactions.length === 0) {
      return [{
        category: 'No Data',
        value: 0,
        color: COLORS[0]
      }];
    }
    
    return processChartData(transactions);
  }, [transactions, isLoading]);
  
  // Calculate total spending
  const totalSpending = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.value, 0);
  }, [chartData]);

  // Only show loading skeleton when explicitly loading, not when there's no data
  if (isLoading && transactionsStatus !== 'succeeded') {
    return (
      <Card className="flex flex-col w-full">
        <CardHeader className="items-center pb-0">
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Spending Breakdown</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto aspect-square w-full max-h-[250px] flex items-center justify-center">
            <Skeleton className="h-[200px] w-[200px] rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // We'll always show the chart, even with zero values
  // This ensures we don't show loading skeletons indefinitely

  return (
    <Card className="flex flex-col w-full">
      <CardHeader className="items-center pb-0">
        <CardTitle>Category Distribution</CardTitle>
        <CardDescription>Spending Breakdown</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <div className="mx-auto aspect-square w-full max-h-[250px]">
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
                            <span className="font-bold text-muted-foreground">
                              {data.category}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              Amount
                            </span>
                            <span className="font-bold">
                              {formatCurrency(data.value)}
                            </span>
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
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {chartData.length > 0 && (
          <div className="flex items-center gap-2 font-medium leading-none">
            Top category: {chartData[0].category}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 w-full">
          {chartData.map((item, index) => (
            <div key={item.category} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <div className="text-xs font-medium truncate">{item.category}</div>
              <div className="ml-auto text-xs text-muted-foreground">
                {formatCurrency(item.value)}
              </div>
            </div>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
};

export default PieDonutChart;
