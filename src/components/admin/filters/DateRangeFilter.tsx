
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
  return null;
};

export default DateRangeFilter;
