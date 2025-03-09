"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { CalendarIcon } from 'lucide-react'
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateRangePickerProps extends React.HTMLAttributes<HTMLDivElement> {
  dateRange?: DateRange;
  onDateRangeChange?: (range: DateRange | undefined) => void;
}

export function DateRangePickerWithRange({
  className,
  dateRange,
  onDateRangeChange,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(dateRange)
  const [date, setDate] = React.useState<DateRange | undefined>(dateRange)

  // Update internal state when prop changes
  React.useEffect(() => {
    setDate(dateRange)
    setTempDate(dateRange)
  }, [dateRange])

  // Handle temporary date selection (doesn't apply until Done is clicked)
  const handleTempSelect = (range: DateRange | undefined) => {
    setTempDate(range)
  }

  // Handle clear button click
  const handleClear = () => {
    setTempDate(undefined)
  }

  // Handle done button click
  const handleDone = () => {
    setDate(tempDate)
    onDateRangeChange?.(tempDate)
    setIsOpen(false)
  }

  // Handle cancel (close without applying)
  const handleCancel = () => {
    setTempDate(date) // Reset to the current applied date
    setIsOpen(false)
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={(open) => {
        if (open) {
          setIsOpen(true)
        } else {
          handleCancel()
        }
      }}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y")} -{" "}
                  {format(date.to, "LLL dd, y")}
                </>
              ) : (
                format(date.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempDate?.from || new Date()}
              selected={tempDate}
              onSelect={handleTempSelect}
              numberOfMonths={2}
              disabled={false}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleClear}>
                Clear
              </Button>
              <Button size="sm" onClick={handleDone}>
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
