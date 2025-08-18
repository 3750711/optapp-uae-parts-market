
import React from 'react';
import { Loader2 } from 'lucide-react';

export const RouteSuspenseFallback: React.FC = () => {
  console.log("🔄 RouteSuspenseFallback: Rendering fallback");
  
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-optapp-yellow mx-auto" />
        <p className="text-gray-600">Загрузка страницы...</p>
      </div>
    </div>
  );
};
