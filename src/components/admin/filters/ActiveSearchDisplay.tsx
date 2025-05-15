
import React from 'react';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ActiveSearchDisplayProps {
  searchTerm: string;
  onClear: () => void;
}

const ActiveSearchDisplay: React.FC<ActiveSearchDisplayProps> = ({ searchTerm, onClear }) => {
  if (!searchTerm) {
    return <div className="hidden" />;
  }

  return (
    <div className="flex items-center mb-4">
      <p className="text-sm text-muted-foreground">
        Поиск по запросу: <span className="font-medium text-foreground">{searchTerm}</span>
      </p>
      <Button 
        variant="ghost" 
        size="sm" 
        className="ml-2 h-6 px-2" 
        onClick={onClear}
      >
        <X className="h-3 w-3 mr-1" /> Сбросить
      </Button>
    </div>
  );
};

export default ActiveSearchDisplay;
