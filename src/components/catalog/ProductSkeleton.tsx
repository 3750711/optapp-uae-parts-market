
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ProductSkeleton = React.memo(() => (
  <div className="bg-white rounded-xl shadow-card overflow-hidden">
    <Skeleton className="h-[240px] w-full" />
    <div className="p-4">
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  </div>
));

export default ProductSkeleton;
