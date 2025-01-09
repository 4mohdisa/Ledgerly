"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Upload } from 'lucide-react'
import { MetricsCards } from "@/components/app/metrics-cards"
import { SpendingChart } from "@/components/app/charts/bar-chart-multiple"
import { PieDonutChart } from "@/components/app/charts/pie-donut-chart"
import { TransactionsTable } from "@/components/app/tables/transactions-table"
import { AppSidebar } from "@/components/app/app-sidebar"
import { TransactionChart } from "@/components/app/charts/bar-chart-interactive"
import { SpendingRadarChart } from "@/components/app/charts/radar-chart"
import { NetBalanceChart } from "@/components/app/charts/line-chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import Link from 'next/link'

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isUploadFileOpen, setIsUploadFileOpen] = useState(false)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [])

  const handleAddTransaction = () => {
    setIsAddTransactionOpen(true)
  }

  const handleUploadFile = () => {
    setIsUploadFileOpen(true)
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-shrink-0">
        <AppSidebar />
      </div>
      <div className="flex-grow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <div className="space-x-4">
              <Link href="/resr">RESR</Link>
              <Button onClick={handleAddTransaction}>Add Transaction</Button>
              <Button onClick={handleUploadFile} variant="outline">
                <Upload className="mr-2 h-4 w-4" /> Upload File
              </Button>
            </div>
          </div>

          <div className="space-y-8">
            <MetricsCards />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-3">
                {isLoading ? (
                  <Skeleton className="w-full h-[400px]" />
                ) : (
                  <TransactionChart />
                )}
              </div>

              <div className="lg:col-span-3">
                {isLoading ? (
                  <Skeleton className="w-full h-[400px]" />
                ) : (
                  <NetBalanceChart />
                )}
              </div>

              <div>
                {isLoading ? (
                  <Skeleton className="w-full h-[300px]" />
                ) : (
                  <SpendingChart />
                )}
              </div>

              <div>
                {isLoading ? (
                  <Skeleton className="w-full h-[300px]" />
                ) : (
                  <PieDonutChart />
                )}
              </div>

              <div>
                {isLoading ? (
                  <Skeleton className="w-full h-[300px]" />
                ) : (
                  <SpendingRadarChart />
                )}
              </div>
            </div>

            <TransactionsTable />
          </div>
        </div>
      </div>

      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Transaction</DialogTitle>
            <DialogDescription>
              Enter the details of your new transaction here.
            </DialogDescription>
          </DialogHeader>
          {/* Add your transaction form here */}
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadFileOpen} onOpenChange={setIsUploadFileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Select a file to upload.
            </DialogDescription>
          </DialogHeader>
          {/* Add your file upload component here */}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add console log for debugging
console.log("Dashboard page rendered");

