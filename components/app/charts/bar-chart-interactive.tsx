"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, Line, LineChart } from "recharts"

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
import { format, addDays, startOfDay, endOfDay, eachDayOfInterval } from "date-fns"

interface Transaction {
  date: string
  amount: number
  type: string
  [key: string]: any
}

interface TransactionChartProps {
  transactions: Transaction[]
  dateRange: { start: Date; end: Date }
  metrics: { key: string; label: string; color: string }[]
  chartType?: 'bar' | 'line'
}

const processChartData = (transactions: Transaction[], dateRange: { start: Date; end: Date }, metrics: { key: string; label: string; color: string }[]) => {
  const start = startOfDay(dateRange.start);
  const end = endOfDay(dateRange.end);
  const days = eachDayOfInterval({ start, end });

  const initialData = days.map(day => {
    const date = format(day, 'yyyy-MM-dd');
    const dataPoint: { [key: string]: any } = { date };
    metrics.forEach(metric => {
      dataPoint[metric.key] = 0;
    });
    return dataPoint;
  });

  const dateMap = new Map(initialData.map(item => [item.date, item]));

  transactions.forEach(transaction => {
    const date = format(new Date(transaction.date), 'yyyy-MM-dd');
    if (dateMap.has(date)) {
      const entry = dateMap.get(date)!;
      metrics.forEach(metric => {
        if (transaction.type.toLowerCase() === metric.key.toLowerCase()) {
          entry[metric.key] += transaction.amount;
        }
      });
    }
  });

  return Array.from(dateMap.values());
};

export function TransactionChart({ transactions, dateRange, metrics, chartType = 'bar' }: TransactionChartProps) {
  const [activeChart, setActiveChart] = React.useState<string>(metrics[0].key)

  const chartData = React.useMemo(() => processChartData(transactions, dateRange, metrics), [transactions, dateRange, metrics])

  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      transactions: { label: "Transactions" },
    };
    metrics.forEach(metric => {
      config[metric.key] = {
        label: metric.label,
        color: metric.color,
      };
    });
    return config;
  }, [metrics]);

  const total = React.useMemo(
    () => metrics.reduce((acc, metric) => ({
      ...acc,
      [metric.key]: chartData.reduce((sum, curr) => sum + (curr[metric.key] || 0), 0),
    }), {}),
    [chartData, metrics]
  )

  const renderChart = () => {
    const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
    const DataComponent = chartType === 'bar' ? Bar : Line;

    return (
      <ResponsiveContainer width="100%" height={350}>
        <ChartComponent
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => format(new Date(value), 'MMM d')}
          />
          <YAxis />
          <Tooltip
            content={
              <ChartTooltipContent
                className="w-[150px]"
                nameKey="transactions"
                labelFormatter={(value) => format(new Date(value), 'MMM d, yyyy')}
              />
            }
          />
          {metrics.map((metric) => (
            <DataComponent
              key={metric.key}
              type="monotone"
              dataKey={metric.key}
              stroke={metric.color}
              fill={metric.color}
              hide={activeChart !== metric.key}
            />
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  return (
    <Card className="col-span-3 w-full">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>Transaction Analysis</CardTitle>
          <CardDescription>
            Daily income and expenses overview
          </CardDescription>
        </div>
        <div className="flex">
          {metrics.map((metric) => (
            <button
              key={metric.key}
              data-active={activeChart === metric.key}
              className="relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l data-[active=true]:bg-muted/50 sm:border-l sm:border-t-0 sm:px-8 sm:py-6"
              onClick={() => setActiveChart(metric.key)}
            >
              <span className="text-xs text-muted-foreground">
                {metric.label}
              </span>
              <span className="text-lg font-bold leading-none sm:text-3xl">
                ${(total[metric.key] as number).toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[350px] w-full"
        >
          {renderChart()}
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

