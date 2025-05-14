
import React from 'react';
import { Button } from "@/components/ui/button";

interface ActiveSearchDisplayProps {
  activeSearchTerm: string;
  onClearSearch: () => void;
}

const ActiveSearchDisplay: React.FC<ActiveSearchDisplayProps> = ({ 
  activeSearchTerm, 
  onClearSearch 
}) => {
  if (!activeSearchTerm) return null;
  
  return (
    <div className="flex items-center mb-4">
      <p className="text-sm text-muted-foreground">
        Поиск по запросу: <span className="font-medium text-foreground">{activeSearchTerm}</span>
      </p>
      <Button 
        variant="ghost" 
        size="sm" 
        className="ml-2 h-6" 
        onClick={onClearSearch}
      >
        Сбросить
      </Button>
    </div>
  );
};

export default ActiveSearchDisplay;
