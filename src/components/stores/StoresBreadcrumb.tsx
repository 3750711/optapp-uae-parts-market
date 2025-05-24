
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage
} from '@/components/ui/breadcrumb';
import { Link } from 'react-router-dom';
import { Home, Store } from 'lucide-react';

interface StoresBreadcrumbProps {
  searchQuery?: string;
  totalCount?: number;
}

const StoresBreadcrumb: React.FC<StoresBreadcrumbProps> = ({
  searchQuery,
  totalCount
}) => {
  return (
    <div className="mb-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Home className="h-4 w-4" />
                Главная
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-1 font-medium">
              <Store className="h-4 w-4" />
              {searchQuery ? (
                <span>Поиск: "{searchQuery}"</span>
              ) : (
                <span>Магазины {totalCount ? `(${totalCount})` : ''}</span>
              )}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
};

export default StoresBreadcrumb;
