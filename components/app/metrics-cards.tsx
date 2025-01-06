"use client"

import * as React from "react";
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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Total Income</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">${metrics.totalIncome.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Total Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">${metrics.totalExpenses.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Net Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">${metrics.netBalance.toLocaleString()}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-lg font-bold">{metrics.topCategory}</div>
        </CardContent>
      </Card>
    </div>
  );
}
