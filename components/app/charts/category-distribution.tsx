"use client"

import * as React from "react";
import { Pie, PieChart, Cell } from "recharts";
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
  { category: "Food", value: 400 },
  { category: "Transport", value: 300 },
  { category: "Utilities", value: 300 },
  { category: "Entertainment", value: 200 },
  { category: "Healthcare", value: 278 },
  { category: "Others", value: 189 },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#FF4560", "#00A6B4"];

const chartConfig = {
  category: {
    label: "Category",
  },
} satisfies ChartConfig;

export function CategoryDistribution() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Distribution</CardTitle>
        <CardDescription>Spending Breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              label
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
