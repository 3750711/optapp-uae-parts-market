
import { Skeleton } from "@/components/ui/skeleton";

interface MakeOfferButtonSkeletonProps {
  compact?: boolean;
}

export const MakeOfferButtonSkeleton = ({ compact = false }: MakeOfferButtonSkeletonProps) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10 rounded-full shadow-sm" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-9 w-full rounded-lg shadow-sm" />
    </div>
  );
};
