"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format, addMonths, subMonths } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface MonthPickerProps {
  date: Date
  onDateChange: (date: Date) => void
  className?: string
}

export function MonthPicker({ date, onDateChange, className }: MonthPickerProps) {
  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(date.getFullYear(), parseInt(monthIndex))
    onDateChange(newDate)
  }

  const handleYearChange = (year: string) => {
    const newDate = new Date(parseInt(year), date.getMonth())
    onDateChange(newDate)
  }

  const handlePrevMonth = () => {
    onDateChange(subMonths(date, 1))
  }

  const handleNextMonth = () => {
    onDateChange(addMonths(date, 1))
  }

  const years = Array.from({ length: 10 }, (_, i) => date.getFullYear() - 5 + i)

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevMonth}
        aria-label="Previous month"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <Select value={date.getMonth().toString()} onValueChange={handleMonthChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue>{format(date, "MMMM")}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 12 }, (_, i) => (
            <SelectItem key={i} value={i.toString()}>
              {format(new Date(date.getFullYear(), i), "MMMM")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={date.getFullYear().toString()} onValueChange={handleYearChange}>
        <SelectTrigger className="w-[100px]">
          <SelectValue>{date.getFullYear()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {years.map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        aria-label="Next month"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

