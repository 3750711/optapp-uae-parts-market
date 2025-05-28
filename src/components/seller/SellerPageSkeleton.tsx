
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const SellerPageSkeleton = () => {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center mb-6">
        <Skeleton className="h-10 w-24 mr-4" />
        <Skeleton className="h-8 w-48" />
      </div>

      {/* Store info skeleton */}
      <Card className="bg-blue-50 mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-32" />
          </div>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <div>
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-32" />
        </CardContent>
      </Card>

      {/* Stats grid skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-8 rounded-lg" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Dashboard cards skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(7)].map((_, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <Skeleton className="h-8 w-8" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SellerPageSkeleton;
