
import React from "react";
import { Clock } from "lucide-react";

interface WorkingHoursInfoProps {
  isMobile?: boolean;
}

export const WorkingHoursInfo: React.FC<WorkingHoursInfoProps> = ({ isMobile = false }) => {
  const iconSize = isMobile ? "h-3 w-3" : "h-4 w-4";
  const padding = isMobile ? "p-2" : "p-2.5";
  const gap = isMobile ? "gap-1.5" : "gap-2";

  return (
    <div className={`flex items-center ${gap} text-xs text-gray-600 bg-blue-50 ${padding} rounded-md border border-blue-100`}>
      <Clock className={`${iconSize} text-blue-600 flex-shrink-0`} />
      <span>Представители работают: 9:00 - 21:00 (UTC+4)</span>
    </div>
  );
};
