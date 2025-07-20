
import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface OfferCountdownProps {
  expiresAt: string;
  compact?: boolean;
}

export const OfferCountdown: React.FC<OfferCountdownProps> = ({ 
  expiresAt, 
  compact = false 
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalSeconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        const totalSeconds = Math.floor(difference / 1000);
        
        return { hours, minutes, seconds, totalSeconds };
      }
      return null;
    };

    const updateTimer = () => {
      setTimeLeft(calculateTimeLeft());
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [expiresAt]);

  if (!timeLeft) {
    return (
      <div className={`flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded ${
        compact ? 'text-xs' : 'text-sm'
      }`}>
        <AlertTriangle className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-red-600`} />
        <span className="text-red-800 font-medium">Предложение истекло</span>
      </div>
    );
  }

  // Определяем цвет на основе оставшегося времени
  const getColorClass = () => {
    const totalHours = timeLeft.totalSeconds / 3600;
    if (totalHours > 3) return 'green';
    if (totalHours > 1) return 'yellow';
    return 'red';
  };

  const colorClass = getColorClass();
  const progressPercentage = Math.min((timeLeft.totalSeconds / (6 * 3600)) * 100, 100);

  const colorStyles = {
    green: 'bg-green-50 border-green-200 text-green-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    red: 'bg-red-50 border-red-200 text-red-800'
  };

  const progressStyles = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  };

  if (compact) {
    return (
      <div className={`p-2 rounded border ${colorStyles[colorClass]}`}>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-3 w-3 animate-spin" />
          <span className="text-xs font-medium">
            {timeLeft.hours}ч {timeLeft.minutes}м {timeLeft.seconds}с
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div 
            className={`h-1 rounded-full transition-all duration-1000 ${progressStyles[colorClass]}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 rounded-lg border ${colorStyles[colorClass]}`}>
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 animate-spin" />
        <span className="font-medium text-sm">Предложение действительно</span>
      </div>
      <div className="text-lg font-bold mb-2">
        {timeLeft.hours}ч {timeLeft.minutes}м {timeLeft.seconds}с
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-1000 ${progressStyles[colorClass]}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};
