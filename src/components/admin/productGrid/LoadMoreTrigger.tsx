
import React from 'react';

interface LoadMoreTriggerProps {
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  innerRef: React.RefObject<HTMLDivElement>;
}

const LoadMoreTrigger: React.FC<LoadMoreTriggerProps> = ({ 
  hasNextPage, 
  isFetchingNextPage, 
  innerRef 
}) => {
  if (!hasNextPage) return null;

  return (
    <div 
      ref={innerRef}
      className="w-full py-8 flex items-center justify-center"
    >
      {isFetchingNextPage ? (
        <div className="flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-t-blue-500 border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin"></div>
          <span className="ml-2">Загрузка...</span>
        </div>
      ) : (
        <div className="h-10"></div> // Empty space to trigger the intersection
      )}
    </div>
  );
};

export default LoadMoreTrigger;
