
import React from "react";
import { Clock } from "lucide-react";

interface WorkingHoursInfoProps {
  isMobile?: boolean;
}

export const WorkingHoursInfo: React.FC<WorkingHoursInfoProps> = ({ isMobile = false }) => {
  const iconSize = isMobile ? "h-4 w-4" : "h-5 w-5";
  const padding = isMobile ? "p-3" : "p-4";
  const gap = isMobile ? "gap-2" : "gap-3";

  return (
    <div className={`flex items-center ${gap} text-sm text-gray-600 bg-blue-50 ${padding} rounded-lg border border-blue-100`}>
      <Clock className={`${iconSize} text-blue-600 flex-shrink-0`} />
      <span>Представители работают: 9:00 - 21:00 (UTC+4)</span>
    </div>
  );
};
