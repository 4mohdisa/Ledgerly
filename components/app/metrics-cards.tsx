"use client"

import * as React from "react"
import { ArrowUpCircle, ArrowDownCircle, DollarSign, PieChart } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const MetricCard = React.memo(({ title, value, icon: Icon, color, onClick }: {
  title: string
  value: number | string
  icon: any
  color: string
  onClick?: () => void
}) => (
  <Card className="relative" onClick={onClick}>
    <CardHeader>
      <CardTitle className="flex items-center text-lg font-semibold">
        <Icon className={`w-5 h-5 mr-2 ${color}`} />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl sm:text-3xl font-bold tracking-tight">
        {typeof value === 'number' ? `$${value.toLocaleString()}` : value}
      </div>
    </CardContent>
  </Card>
))

MetricCard.displayName = 'MetricCard'

export const MetricsCards = React.memo(function MetricsCards() {
  const metrics = React.useMemo(() => ({
    totalIncome: 15000,
    totalExpenses: 12000,
    netBalance: 3000,
    topCategory: "Food",
  }), [])

  const cards = React.useMemo(() => [
    { title: "Total Income", value: metrics.totalIncome, icon: ArrowUpCircle, color: "text-green-500" },
    { title: "Total Expenses", value: metrics.totalExpenses, icon: ArrowDownCircle, color: "text-red-500" },
    { title: "Net Balance", value: metrics.netBalance, icon: DollarSign, color: "text-blue-500"},
    { title: "Top Category", value: metrics.topCategory, icon: PieChart, color: "text-purple-500" },
  ], [metrics])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((item) => (
        <MetricCard
          key={item.title}
          title={item.title}
          value={item.value}
          icon={item.icon}
          color={item.color}
        />
      ))}
    </div>
  )
})
