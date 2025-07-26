import React, { memo } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const DashboardSkeleton = memo(() => {
  const isMobile = useIsMobile();
  
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="h-8 bg-muted rounded w-48 mb-2"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className={`${isMobile ? 'h-10 w-10' : 'h-12 w-12'} bg-muted rounded-full`}></div>
      </div>
      
      {/* Grid skeleton */}
      <div className={`grid grid-cols-1 ${isMobile ? 'gap-3' : 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'}`}>
        {Array.from({ length: 7 }).map((_, index) => (
          <div key={index} className={`bg-white rounded-lg border border-muted ${isMobile ? 'py-2' : ''}`}>
            <div className={isMobile ? "pb-2 pt-4 px-6" : "pb-2 px-6 pt-6"}>
              <div className="h-8 w-8 bg-muted rounded"></div>
            </div>
            <div className={`px-6 pb-6 ${isMobile ? "pt-0" : ""}`}>
              <div className={`${isMobile ? 'h-4' : 'h-5'} bg-muted rounded w-3/4 mb-2`}></div>
              <div className={`${isMobile ? 'h-3' : 'h-4'} bg-muted rounded w-full mb-1`}></div>
              <div className={`${isMobile ? 'h-3' : 'h-4'} bg-muted rounded w-2/3`}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

DashboardSkeleton.displayName = "DashboardSkeleton";

export default DashboardSkeleton;