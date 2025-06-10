
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface LoadMoreTriggerProps {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
}

const LoadMoreTrigger: React.FC<LoadMoreTriggerProps> = ({ 
  hasNextPage, 
  isLoading, 
  onLoadMore
}) => {
  if (!hasNextPage) return null;

  return (
    <div className="w-full py-8 flex items-center justify-center flex-col gap-4">
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Загрузка...</span>
        </div>
      ) : (
        <>
          <div className="h-10"></div> {/* Empty space to trigger the intersection */}
          <Button 
            onClick={onLoadMore}
            className="px-6 py-2"
            variant="secondary"
          >
            <Download className="h-4 w-4 mr-2" /> Загрузить еще
          </Button>
        </>
      )}
    </div>
  );
};

export default LoadMoreTrigger;
