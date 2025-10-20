import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const MobileCatalogCardSkeleton = () => (
  <Card className="overflow-hidden bg-white rounded-xl shadow">
    <div className="p-2.5 space-y-2.5">
      {/* Image skeleton */}
      <Skeleton className="w-full aspect-[4/3] rounded-lg" />
      
      {/* Info block */}
      <div className="px-2.5 space-y-2">
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        {/* Price */}
        <Skeleton className="h-6 w-1/3" />
        {/* Meta */}
        <Skeleton className="h-4 w-1/2" />
      </div>
      
      {/* Footer */}
      <div className="border-t border-gray-100 pt-2 px-2.5 flex justify-between">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  </Card>
);
