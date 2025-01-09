"use client"

import * as React from "react";
import { ArrowUpCircle, ArrowDownCircle, DollarSign, PieChart } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function MetricsCards() {
  const metrics = {
    totalIncome: 15000,
    totalExpenses: 12000,
    netBalance: 3000,
    topCategory: "Food",
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
{ title: "Total Income", value: metrics.totalIncome, icon: ArrowUpCircle, color: "text-green-500" },
{ title: "Total Expenses", value: metrics.totalExpenses, icon: ArrowDownCircle, color: "text-red-500" },
{ title: "Net Balance", value: metrics.netBalance, icon: DollarSign, color: "text-blue-500" },
{ title: "Top Category", value: metrics.topCategory, icon: PieChart, color: "text-purple-500" },
      ].map((item, index) => (
        <div
          key={item.title}
        >
          <Card className={`overflow-hidden`}>
            <div className={`absolute inset-0 opacity-10`}></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center text-lg font-semibold">
                <item.icon className={`w-5 h-5 mr-2 text- ${item.color}`} />
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold tracking-tight">
                {typeof item.value === 'number' ? `$${item.value.toLocaleString()}` : item.value}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}

