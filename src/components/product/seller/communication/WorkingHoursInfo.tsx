
import React from "react";
import { Clock } from "lucide-react";

interface WorkingHoursInfoProps {
  isMobile?: boolean;
}

export const WorkingHoursInfo: React.FC<WorkingHoursInfoProps> = ({ isMobile = false }) => {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 shadow-lg ${isMobile ? 'p-3' : 'p-4'}`}>
      {/* Декоративные элементы */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-blue-200/30 rounded-full -translate-y-2 translate-x-2"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 bg-indigo-200/30 rounded-full translate-y-2 -translate-x-2"></div>
      
      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
          <Clock className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1">
          <h4 className={`font-semibold text-gray-800 ${isMobile ? 'text-sm' : 'text-base'} mb-1`}>
            Время работы
          </h4>
          <p className={`text-gray-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
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
