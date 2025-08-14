
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { Home } from 'lucide-react';

interface CatalogBreadcrumbProps {
  searchQuery?: string;
}

const CatalogBreadcrumb: React.FC<CatalogBreadcrumbProps> = ({
  searchQuery
}) => {
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center">
              <Home className="h-4 w-4 mr-1" />
              Главная
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        {!searchQuery ? (
          <BreadcrumbPage>Каталог</BreadcrumbPage>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/catalog">Каталог</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
        
        {searchQuery && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbPage>AI Поиск: "{searchQuery}"</BreadcrumbPage>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CatalogBreadcrumb;
