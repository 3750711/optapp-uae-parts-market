
import React from "react";
import { Clock } from "lucide-react";

interface WorkingHoursInfoProps {
  isMobile?: boolean;
}

export const WorkingHoursInfo: React.FC<WorkingHoursInfoProps> = ({ isMobile = false }) => {
  return (
    <div className="border rounded-lg p-3 bg-blue-50">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-blue-600" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-blue-900 mb-1">
            Время работы
          </h4>
          <p className="text-xs text-blue-700">
            Представители: 9:00 - 21:00 (UTC+4)
          </p>
        </div>
        <span className="text-lg">🕘</span>
      </div>
    </div>
  );
};
