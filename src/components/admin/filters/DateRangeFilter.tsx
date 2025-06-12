
import React from 'react';
import { format } from "date-fns";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
}

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange, disabled = false }) => {
  return (
    <div className="space-y-2">
      <label className="text-sm">Дата создания</label>
      <div className="flex flex-col">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              disabled={disabled}
              className={cn(
                "justify-start text-left font-normal",
                !value.from && !value.to && "text-muted-foreground"
              )}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {value.from ? (
                value.to ? (
                  <>
                    {format(value.from, "dd/MM/yyyy")} - {format(value.to, "dd/MM/yyyy")}
                  </>
                ) : (
                  format(value.from, "dd/MM/yyyy")
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
              defaultMonth={value.from || new Date()}
              selected={{
                from: value.from || undefined,
                to: value.to || undefined,
              }}
              onSelect={(selectedDateRange) => {
                if (selectedDateRange) {
                  onChange({
                    from: selectedDateRange.from || null,
                    to: selectedDateRange.to || null
                  });
                } else {
                  onChange({ from: null, to: null });
                }
              }}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default DateRangeFilter;
