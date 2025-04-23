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
  transactions?: Transaction[];
  metrics?: { key: string; label: string; color: string }[];
  chartType?: 'bar' | 'line';
}

const processChartData = (transactions: Transaction[], metrics: { key: string; label: string; color: string }[]) => {
  const data = transactions.map(transaction => {
    const dataPoint: { [key: string]: any } = { date: transaction.date };
    metrics.forEach(metric => {
      dataPoint[metric.key] = 0;
    });
    metrics.forEach(metric => {
      if (transaction.type.toLowerCase() === metric.key.toLowerCase()) {
        dataPoint[metric.key] += transaction.amount;
      }
    });
    return dataPoint;
  });

  return data;
};

const DEFAULT_METRICS = [
  { key: "income", label: "Income", color: "hsl(var(--chart-1))" },
  { key: "expense", label: "Expense", color: "hsl(var(--chart-2))" }
];

export function TransactionChart({ 
  transactions = [], 
  metrics = DEFAULT_METRICS, 
  chartType = 'bar' 
}: TransactionChartProps) {
  // Use useRef to track component mounted state
  const isMounted = React.useRef(true);
  
  // Initialize activeChart with the first metric key if available, otherwise 'income'
  const [activeChart, setActiveChart] = React.useState<string>(() => 
    metrics && metrics.length > 0 ? metrics[0].key : 'income'
  );

  // Add cleanup effect to prevent memory leaks and disconnection errors
  React.useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    // Cleanup function
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Only update activeChart if metrics array changes completely
  React.useEffect(() => {
    if (isMounted.current && metrics && metrics.length > 0 && !metrics.find(m => m.key === activeChart)) {
      setActiveChart(metrics[0].key);
    }
  }, [metrics, activeChart]);

  const chartData = React.useMemo(() => {
    if (!transactions || !metrics) {
      return [];
    }
    return processChartData(transactions, metrics);
  }, [transactions, metrics]);

  const chartConfig: ChartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      transactions: { label: "Transactions" },
    };
    if (metrics) {
      metrics.forEach(metric => {
        config[metric.key] = {
          label: metric.label,
          color: metric.color,
        };
      });
    }
    return config;
  }, [metrics]);

  // Define type for totals
  type ChartTotals = {
    [key: string]: number;
  };

  // Memoize the total calculation instead of using state
  const total = React.useMemo<ChartTotals>(() => {
    if (!chartData || !metrics) {
      return {};
    }
    return metrics.reduce((acc, metric) => ({
      ...acc,
      [metric.key]: chartData.reduce((sum, curr) => sum + (curr[metric.key] || 0), 0),
    }), {} as ChartTotals);
  }, [chartData, metrics]);

  const renderChart = React.useCallback(() => {
    const ChartComponent = chartType === 'bar' ? BarChart : LineChart;
    const DataComponent = chartType === 'bar' ? Bar : Line;

    return (
      // Use width and height as percentages to make it truly responsive
      <ResponsiveContainer>
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
          {metrics.map((metric) => {
            // Render different components based on chart type
            return chartType === 'bar' ? (
              <Bar
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                stroke={metric.color}
                fill={metric.color}
                hide={activeChart !== metric.key}
              />
            ) : (
              <Line
                key={metric.key}
                type="monotone"
                dataKey={metric.key}
                stroke={metric.color}
                fill={metric.color}
                hide={activeChart !== metric.key}
                // Use activeDot instead of dot to avoid React key warnings
                activeDot={{
                  r: 4,
                  fill: metric.color,
                  stroke: metric.color
                }}
              />
            );
          })}
        </ChartComponent>
      </ResponsiveContainer>
    );
  }, [chartData, metrics, activeChart, chartType]);

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
                ${(total[metric.key] || 0).toLocaleString()}
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