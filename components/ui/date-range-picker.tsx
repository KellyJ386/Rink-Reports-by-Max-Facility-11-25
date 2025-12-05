'use client'

import * as React from 'react'
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export interface DateRange {
  from: Date | null
  to: Date | null
}

export interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  className?: string
  placeholder?: string
  minDate?: Date
  maxDate?: Date
}

const presets = [
  {
    label: 'Today',
    getValue: () => {
      const today = new Date()
      return { from: today, to: today }
    },
  },
  {
    label: 'Yesterday',
    getValue: () => {
      const yesterday = subDays(new Date(), 1)
      return { from: yesterday, to: yesterday }
    },
  },
  {
    label: 'Last 7 days',
    getValue: () => ({
      from: subDays(new Date(), 6),
      to: new Date(),
    }),
  },
  {
    label: 'Last 14 days',
    getValue: () => ({
      from: subDays(new Date(), 13),
      to: new Date(),
    }),
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      from: subDays(new Date(), 29),
      to: new Date(),
    }),
  },
  {
    label: 'This week',
    getValue: () => ({
      from: startOfWeek(new Date()),
      to: endOfWeek(new Date()),
    }),
  },
  {
    label: 'Last week',
    getValue: () => {
      const lastWeekStart = subDays(startOfWeek(new Date()), 7)
      return {
        from: lastWeekStart,
        to: subDays(startOfWeek(new Date()), 1),
      }
    },
  },
  {
    label: 'This month',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Last month',
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
      }
    },
  },
  {
    label: 'This year',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: new Date(),
    }),
  },
]

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder = 'Select date range',
  minDate,
  maxDate,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState(value.from || new Date())

  const formatDateRange = () => {
    if (!value.from) return placeholder
    if (!value.to) return format(value.from, 'MMM d, yyyy')
    if (format(value.from, 'MMM d, yyyy') === format(value.to, 'MMM d, yyyy')) {
      return format(value.from, 'MMM d, yyyy')
    }
    return `${format(value.from, 'MMM d, yyyy')} - ${format(value.to, 'MMM d, yyyy')}`
  }

  const handleRangeChange = (start: Date | null, end: Date | null) => {
    onChange({ from: start, to: end })
    if (start && end) {
      setOpen(false)
    }
  }

  const handlePresetClick = (preset: typeof presets[0]) => {
    const range = preset.getValue()
    onChange(range)
    setMonth(range.from || new Date())
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value.from && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="border-r p-3 space-y-1">
            <p className="text-xs font-medium text-gray-500 mb-2">Quick Select</p>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sm"
                onClick={() => handlePresetClick(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          {/* Calendar */}
          <div className="p-0">
            <Calendar
              mode="range"
              rangeStart={value.from}
              rangeEnd={value.to}
              onRangeChange={handleRangeChange}
              minDate={minDate}
              maxDate={maxDate}
            />
          </div>
        </div>
        {/* Footer */}
        <div className="border-t p-3 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange({ from: null, to: null })
            }}
          >
            Clear
          </Button>
          <div className="text-sm text-gray-500">
            {value.from && value.to && (
              <>
                {Math.ceil((value.to.getTime() - value.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days selected
              </>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
