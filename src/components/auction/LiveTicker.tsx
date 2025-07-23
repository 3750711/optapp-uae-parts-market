
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Users,
  Gavel,
  DollarSign,
  Trophy
} from 'lucide-react';

interface LiveTickerProps {
  events: Array<{
    id: string;
    type: 'bid' | 'win' | 'new_auction' | 'ending_soon';
    product: string;
    user?: string;
    amount?: number;
    time: Date;
  }>;
  isConnected: boolean;
}

export const LiveTicker: React.FC<LiveTickerProps> = ({ events, isConnected }) => {
  const [visibleEvents, setVisibleEvents] = useState(events.slice(0, 10));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setVisibleEvents(events.slice(0, 10));
  }, [events]);

  useEffect(() => {
    if (visibleEvents.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % visibleEvents.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [visibleEvents.length]);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bid': return <TrendingUp className="h-4 w-4" />;
      case 'win': return <Trophy className="h-4 w-4" />;
      case 'new_auction': return <Gavel className="h-4 w-4" />;
      case 'ending_soon': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'bid': return 'bg-blue-500';
      case 'win': return 'bg-green-500';
      case 'new_auction': return 'bg-purple-500';
      case 'ending_soon': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (visibleEvents.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Ожидание активности...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentEvent = visibleEvents[currentIndex];

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${getEventColor(currentEvent.type)} text-white`}>
              {getEventIcon(currentEvent.type)}
            </div>
            
            <div>
              <div className="font-medium text-sm line-clamp-1">
                {currentEvent.product}
              </div>
              <div className="text-xs text-gray-600">
                {currentEvent.user && `${currentEvent.user} • `}
                {currentEvent.amount && `$${currentEvent.amount.toLocaleString()} • `}
                {currentEvent.time.toLocaleTimeString('ru-RU')}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "secondary"} className="text-xs">
              <div className={`w-2 h-2 rounded-full mr-1 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {isConnected ? 'Live' : 'Offline'}
            </Badge>
            
            <div className="text-xs text-gray-500">
              {currentIndex + 1}/{visibleEvents.length}
            </div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / visibleEvents.length) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
