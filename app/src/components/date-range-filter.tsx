"use client"

import * as React from "react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { IconCalendar, IconX } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export type { DateRange }

interface DateRangeFilterProps {
  range: DateRange | undefined
  onRangeChange: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangeFilter({ range, onRangeChange, className }: DateRangeFilterProps) {
  const hasRange = !!range?.from

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={hasRange ? "secondary" : "outline"}
            size="sm"
            className="h-8 gap-1.5 text-xs"
          >
            <IconCalendar className="size-3.5" />
            {hasRange ? (
              range.to ? (
                <>{format(range.from!, "MMM d")} – {format(range.to, "MMM d, yyyy")}</>
              ) : (
                format(range.from!, "MMM d, yyyy")
              )
            ) : (
              "All time"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={range}
            onSelect={onRangeChange}
            numberOfMonths={2}
            autoFocus
          />
          {hasRange && (
            <div className="border-t p-2 text-right">
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => onRangeChange(undefined)}
              >
                Clear range
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {hasRange && (
        <Button
          variant="ghost"
          size="sm"
          className="size-8 p-0"
          onClick={() => onRangeChange(undefined)}
        >
          <IconX className="size-3.5" />
        </Button>
      )}
    </div>
  )
}

/** Filter an array of { date: string } objects by an optional DateRange */
export function applyDateRange<T extends { date: string }>(
  data: T[],
  range: DateRange | undefined,
): T[] {
  if (!range?.from) return data
  return data.filter((d) => {
    const dt = new Date(d.date + "T12:00:00")
    if (range.from && dt < range.from) return false
    if (range.to) {
      const end = new Date(range.to)
      end.setHours(23, 59, 59, 999)
      if (dt > end) return false
    }
    return true
  })
}
