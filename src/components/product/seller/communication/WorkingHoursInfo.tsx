
import React from "react";
import { Clock } from "lucide-react";

interface WorkingHoursInfoProps {
  isMobile?: boolean;
}

export const WorkingHoursInfo: React.FC<WorkingHoursInfoProps> = ({ isMobile = false }) => {
  return (
    <div className={`relative overflow-hidden rounded-lg bg-accent border border-border shadow-sm ${isMobile ? 'p-3' : 'p-4'}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-sm">
          <Clock className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold text-accent-foreground ${isMobile ? 'text-sm' : 'text-base'} mb-1`}>
            Время работы
          </h4>
          <p className={`text-accent-foreground/80 ${isMobile ? 'text-xs' : 'text-sm'}`}>
            Представители: 9:00 - 21:00 (UTC+4)
          </p>
        </div>
        <div className="text-2xl">
          🕘
        </div>
      </div>
    </div>
  );
};
