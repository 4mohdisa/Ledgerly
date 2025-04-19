'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function TransactionRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-100">
      <div className="flex items-center gap-3 flex-1">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px]" />
          <Skeleton className="h-3 w-[100px]" />
        </div>
      </div>
      <div className="flex flex-col items-end">
        <Skeleton className="h-4 w-[80px]" />
        <Skeleton className="h-3 w-[60px] mt-1" />
      </div>
    </div>
  );
}

export function TransactionTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-md border">
      <div className="p-4 bg-muted/20">
        <div className="flex justify-between items-center">
          <Skeleton className="h-5 w-[200px]" />
          <Skeleton className="h-5 w-[100px]" />
        </div>
      </div>
      <div>
        {Array(rows).fill(0).map((_, index) => (
          <TransactionRowSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
