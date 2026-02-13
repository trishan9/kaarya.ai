"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type CalendarProps = {
  selected?: Date;
  onSelect?: (date: Date) => void;
  month?: Date;
  onMonthChange?: (month: Date) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
};

type DayCell = {
  date: Date;
  isCurrentMonth: boolean;
};

const weekdayLabels = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfMonth = (value: Date) =>
  new Date(value.getFullYear(), value.getMonth(), 1);

const buildMonthGrid = (monthDate: Date): DayCell[] => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingCount = firstDay.getDay();
  const currentMonthDays = lastDay.getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  const days: DayCell[] = [];

  for (let index = leadingCount - 1; index >= 0; index -= 1) {
    days.push({
      date: new Date(year, month - 1, previousMonthDays - index),
      isCurrentMonth: false,
    });
  }

  for (let day = 1; day <= currentMonthDays; day += 1) {
    days.push({
      date: new Date(year, month, day),
      isCurrentMonth: true,
    });
  }

  const trailingCount = 42 - days.length;
  for (let day = 1; day <= trailingCount; day += 1) {
    days.push({
      date: new Date(year, month + 1, day),
      isCurrentMonth: false,
    });
  }

  return days;
};

export function Calendar({
  selected,
  onSelect,
  month,
  onMonthChange,
  disabled,
  className,
}: CalendarProps) {
  const [internalMonth, setInternalMonth] = React.useState<Date>(() =>
    startOfMonth(month ?? selected ?? new Date()),
  );

  const activeMonth = month ? startOfMonth(month) : internalMonth;
  const days = React.useMemo(() => buildMonthGrid(activeMonth), [activeMonth]);

  React.useEffect(() => {
    if (!month) return;
    setInternalMonth(startOfMonth(month));
  }, [month]);

  const setMonth = React.useCallback(
    (next: Date) => {
      const normalized = startOfMonth(next);
      if (!month) {
        setInternalMonth(normalized);
      }
      onMonthChange?.(normalized);
    },
    [month, onMonthChange],
  );

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            setMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1))
          }
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous month</span>
        </Button>
        <p className="text-sm font-semibold text-foreground">
          {activeMonth.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            setMonth(new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next month</span>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weekdayLabels.map((weekday) => (
          <div
            key={weekday}
            className="py-1 text-center text-xs font-medium text-muted-foreground"
          >
            {weekday}
          </div>
        ))}

        {days.map((day) => {
          const isSelected = selected ? isSameDay(day.date, selected) : false;
          const isDisabled = disabled?.(day.date) ?? false;

          return (
            <Button
              key={`${day.date.toISOString()}-${day.isCurrentMonth ? "c" : "o"}`}
              type="button"
              variant={isSelected ? "default" : "ghost"}
              size="icon-sm"
              className={cn(
                "h-8 w-8 rounded-md text-xs",
                !day.isCurrentMonth && "text-muted-foreground/60",
                isSelected && "text-white",
              )}
              disabled={isDisabled}
              onClick={() => onSelect?.(day.date)}
            >
              {day.date.getDate()}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
