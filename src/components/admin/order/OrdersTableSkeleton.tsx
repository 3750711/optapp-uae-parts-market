
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card } from '@/components/ui/card';

const DesktopSkeletonRow = () => (
  <TableRow>
    <TableCell className="w-[40px]">
      <Skeleton className="h-4 w-4" />
    </TableCell>
    <TableCell className="w-[100px]"><Skeleton className="h-4 w-[80px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
    <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
    <TableCell className="w-[120px]">
      <div className="flex items-center gap-2 justify-end">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </TableCell>
  </TableRow>
);

const MobileSkeletonCard = () => (
    <Card className="p-4 space-y-3">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-4 w-4" />
        </div>
        <div className="flex justify-between items-center text-sm">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <div className="border-t pt-3">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2 text-right">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-20" />
                </div>
            </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
        </div>
    </Card>
);

export const OrdersTableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <MobileSkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"><Skeleton className="h-4 w-4" /></TableHead>
            <TableHead className="w-[100px]">Номер</TableHead>
            <TableHead>Название</TableHead>
            <TableHead>Покупатель</TableHead>
            <TableHead>Продавец</TableHead>
            <TableHead>Цена</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right w-[120px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rows }).map((_, i) => (
            <DesktopSkeletonRow key={i} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
