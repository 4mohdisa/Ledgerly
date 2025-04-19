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
import { format, addDays, startOfDay, endOfDay, eachDayOfInterval, parseISO, isValid } from "date-fns"
import { useAppSelector } from '@/redux/hooks'
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/format"

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

const processChartData = (transactions: Transaction[], metrics: { key: string; label: string; color: string }[], dateRange?: { from: Date; to: Date }) => {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  // If we have a date range, create a data point for each day in the range
  let datePoints: { date: string; formattedDate: string; [key: string]: any }[] = [];
  
  if (dateRange?.from && dateRange?.to && isValid(dateRange.from) && isValid(dateRange.to)) {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    datePoints = days.map(day => {
      const dataPoint: { date: string; formattedDate: string; [key: string]: any } = { 
        date: format(day, 'yyyy-MM-dd'),
        formattedDate: format(day, 'MMM dd') 
      };
      metrics.forEach(metric => {
        dataPoint[metric.key] = 0;
      });
      return dataPoint;
    });
  } else {
    // If no date range, use the transaction dates
    const uniqueDates = new Set<string>();
    transactions.forEach(transaction => {
      if (transaction.date) {
        uniqueDates.add(transaction.date);
      }
    });
    
    datePoints = Array.from(uniqueDates).map(dateStr => {
      const dataPoint: { date: string; formattedDate: string; [key: string]: any } = { 
        date: dateStr,
        formattedDate: format(parseISO(dateStr), 'MMM dd')
      };
      metrics.forEach(metric => {
        dataPoint[metric.key] = 0;
      });
      return dataPoint;
    });
  }
  
  // Add transaction amounts to the appropriate date points
  transactions.forEach(transaction => {
    if (!transaction.date) return;
    
    const datePoint = datePoints.find(dp => dp.date === transaction.date);
    if (datePoint) {
      metrics.forEach(metric => {
        if (transaction.type.toLowerCase() === metric.key.toLowerCase()) {
          datePoint[metric.key] += parseFloat(String(transaction.amount)) || 0;
        }
      });
    }
  });

  // Sort by date
  datePoints.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return datePoints;
};

const DEFAULT_METRICS = [
  { key: "income", label: "Income", color: "hsl(var(--chart-1))" },
  { key: "expense", label: "Expense", color: "hsl(var(--chart-2))" }
];

function TransactionChart({ chartType = 'bar' }: TransactionChartProps) {
  // Get transactions and date range from Redux store
  const { items: transactions, status: transactionsStatus } = useAppSelector((state: any) => state.transactions);
  const dateRange = useAppSelector((state: any) => state.filters?.dateRange);
  const isLoading = transactionsStatus === 'loading' || transactionsStatus === 'idle';
  
  const [data, setData] = React.useState<any[]>([]);
  const metrics = React.useMemo(() => DEFAULT_METRICS, []);

  React.useEffect(() => {
    // Even if there are no transactions, we should still process and show empty data
    if (isLoading) {
      return;
    }
    
    // Convert transactions to the format expected by the chart
    const formattedTransactions = transactions.map((t: any) => ({
      date: t.date,
      amount: parseFloat(t.amount) || 0,
      type: t.type
    }));
    
    // Process the transaction data for the chart
    const processedData = processChartData(formattedTransactions, metrics, dateRange);
    setData(processedData);
  }, [transactions, metrics, dateRange, isLoading]);

  // Initialize activeChart with the first metric key if available, otherwise 'income'
  const [activeChart, setActiveChart] = React.useState<string>(() => 
    metrics && metrics.length > 0 ? metrics[0].key : 'income'
  );

  React.useEffect(() => {
    if (metrics && metrics.length > 0 && !metrics.find(m => m.key === activeChart)) {
      setActiveChart(metrics[0].key);
    }
  }, [metrics, activeChart]);

  const chartData = React.useMemo(() => {
    if (!metrics) {
      return [];
    }
    
    // If no transactions, create empty data with the last 7 days
    if (!transactions || transactions.length === 0) {
      const emptyData = [];
      const today = new Date();
      
      // Generate dates for the last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD
        
        const dataPoint: any = { date: formattedDate };
        metrics.forEach(metric => {
          dataPoint[metric.key] = 0;
        });
        
        emptyData.push(dataPoint);
      }
      
      return emptyData;
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
    
    // If there's no data, show a message instead of an empty chart
    if (chartData.length === 0) {
      return (
        <div className="h-full w-full flex items-center justify-center">
          <p className="text-muted-foreground">No transaction data available</p>
        </div>
      );
    }

    return (
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
                labelFormatter={(value) => {
                  // Check if value is a valid date string before formatting
                  try {
                    const date = new Date(value);
                    // Check if date is valid
                    if (isNaN(date.getTime())) {
                      return String(value); // Return the original value if it's not a valid date
                    }
                    return format(date, 'MMM d, yyyy');
                  } catch (error) {
                    console.error('Error formatting date:', error);
                    return String(value); // Return the original value on error
                  }
                }}
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
  );
}

export default TransactionChart;
