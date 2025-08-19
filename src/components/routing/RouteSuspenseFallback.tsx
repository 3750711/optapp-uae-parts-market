
import React from 'react';
import { Loader2 } from 'lucide-react';

export const RouteSuspenseFallback: React.FC = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow mx-auto mb-4" />
      <p className="text-gray-600">Загрузка страницы...</p>
    </div>
  </div>
);
