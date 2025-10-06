import { useProductsNormalQuery } from './useProductsNormalQuery';
import { useProductsWithIssuesQuery } from './useProductsWithIssuesQuery';

interface UseProductsQueryRouterProps {
  debouncedSearchTerm: string;
  statusFilter: string;
  sellerFilter: string;
  notificationIssuesFilter: boolean;
  pageSize?: number;
}

export const useProductsQueryRouter = ({
  debouncedSearchTerm,
  statusFilter,
  sellerFilter,
  notificationIssuesFilter,
  pageSize = 12
}: UseProductsQueryRouterProps) => {
  // Always call both hooks (Rules of Hooks)
  const normalQuery = useProductsNormalQuery({
    debouncedSearchTerm,
    statusFilter,
    sellerFilter,
    pageSize
  });
  
  const issuesQuery = useProductsWithIssuesQuery({
    debouncedSearchTerm,
    statusFilter,
    sellerFilter,
    pageSize
  });
  
  // Return active query based on filter
  return notificationIssuesFilter ? issuesQuery : normalQuery;
};
