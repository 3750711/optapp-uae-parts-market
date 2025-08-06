
import React from "react";
import { Clock } from "lucide-react";
import { CONTACT_CONFIG } from "@/config/contact";

interface WorkingHoursInfoProps {
  isMobile?: boolean;
  customHours?: {
    [key: string]: string;
  } | null;
}

export const WorkingHoursInfo: React.FC<WorkingHoursInfoProps> = ({ 
  isMobile = false,
  customHours 
}) => {
  const workingHours = customHours || CONTACT_CONFIG.DEFAULT_WORKING_HOURS;
  
  const getCurrentDayStatus = () => {
    const now = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = dayNames[now.getDay()];
    const currentHour = now.getHours();
    
    const todayHours = workingHours[currentDay as keyof typeof workingHours];
    
    if (todayHours === 'выходной') {
      return { status: 'closed', text: 'Сегодня выходной' };
    }
    
    // Simple check for business hours (8-13, 16-21)
    const isInWorkingHours = (currentHour >= 8 && currentHour < 13) || (currentHour >= 16 && currentHour < 21);
    
    return {
      status: isInWorkingHours ? 'open' : 'closed',
      text: isInWorkingHours ? 'Сейчас работают' : 'Сейчас не работают'
    };
  };

  const dayStatus = getCurrentDayStatus();

  return (
    <div className="border rounded-lg p-3 bg-gray-50">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-gray-600" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900">
              Время работы
            </h4>
            <span className={`text-xs px-2 py-1 rounded-full ${
              dayStatus.status === 'open' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {dayStatus.text}
            </span>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <p>Сб-Чт: {workingHours.saturday}</p>
            <p>Пт: {workingHours.friday}</p>
          </div>
        </div>
        <span className="text-lg">{dayStatus.status === 'open' ? '🟢' : '🔴'}</span>
      </div>
    </div>
  );
};
