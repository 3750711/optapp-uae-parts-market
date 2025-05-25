
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UsersTableSkeletonProps {
  rows?: number;
  isCompact?: boolean;
}

export const UsersTableSkeleton: React.FC<UsersTableSkeletonProps> = ({ 
  rows = 10, 
  isCompact = false 
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-32" />
          </TableHead>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-20" />
          </TableHead>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-24" />
          </TableHead>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-16" />
          </TableHead>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-24" />
          </TableHead>
          <TableHead className={isCompact ? 'py-2' : ''}>
            <Skeleton className="h-4 w-20" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <div className="flex items-center gap-2">
                <Skeleton className={`rounded-full ${isCompact ? 'h-8 w-8' : 'h-10 w-10'}`} />
                <Skeleton className="h-4 w-24" />
              </div>
            </TableCell>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <Skeleton className="h-4 w-40" />
            </TableCell>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <Skeleton className="h-6 w-16 rounded-full" />
            </TableCell>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <Skeleton className="h-6 w-20 rounded-full" />
            </TableCell>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <Skeleton className="h-6 w-16 rounded-full" />
            </TableCell>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <Skeleton className="h-4 w-12" />
            </TableCell>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell className={isCompact ? 'py-2' : ''}>
              <div className="flex items-center gap-1">
                {Array.from({ length: 6 }).map((_, btnIndex) => (
                  <Skeleton key={btnIndex} className="h-8 w-8" />
                ))}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
