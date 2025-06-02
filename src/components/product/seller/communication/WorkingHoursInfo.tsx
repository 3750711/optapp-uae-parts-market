
import React from "react";
import { Clock } from "lucide-react";

interface WorkingHoursInfoProps {
  isMobile?: boolean;
}

export const WorkingHoursInfo: React.FC<WorkingHoursInfoProps> = ({ isMobile = false }) => {
  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-600" />
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900 mb-1">
            Время работы
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Сб-Чт: 8:00 - 13:00, 16:00 - 21:00</p>
            <p>Пт: выходной</p>
          </div>
        </div>
        <span className="text-lg">🕐</span>
      </div>
    </div>
  );
};
