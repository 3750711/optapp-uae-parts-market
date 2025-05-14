
import React from 'react';
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// DateRange interface matching what component expects
export interface DateRange {
  from: Date | null;
  to?: Date | null;
}

interface DateRangeFilterProps {
  dateRange: DateRange;
  onChange: (range: DateRange | null) => void;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ dateRange, onChange }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm">Дата создания</label>
      <div className="flex flex-col">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !dateRange.from && !dateRange.to && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "dd/MM/yyyy")} - {format(dateRange.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "dd/MM/yyyy")
                )
              ) : (
                "Выберите даты"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              initialFocus
              mode="range"
              defaultMonth={dateRange.from || new Date()}
              selected={{
                from: dateRange.from,
                to: dateRange.to,
              }}
              onSelect={(selectedDateRange) => {
                onChange(selectedDateRange || { from: null, to: null });
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateRangeFilter;
