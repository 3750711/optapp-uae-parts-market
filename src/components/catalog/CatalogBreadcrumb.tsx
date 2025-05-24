
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
  selectedBrandName?: string | null;
  selectedModelName?: string | null;
}

const CatalogBreadcrumb: React.FC<CatalogBreadcrumbProps> = ({
  searchQuery,
  selectedBrandName,
  selectedModelName
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
        
        {!selectedBrandName && !searchQuery ? (
          <BreadcrumbPage>Каталог</BreadcrumbPage>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/catalog">Каталог</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        )}
        
        {selectedBrandName && (
          <>
            <BreadcrumbSeparator />
            {!selectedModelName ? (
              <BreadcrumbPage>{selectedBrandName}</BreadcrumbPage>
            ) : (
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={`/catalog?brand=${selectedBrandName}`}>
                    {selectedBrandName}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
          </>
        )}
        
        {selectedModelName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbPage>{selectedModelName}</BreadcrumbPage>
          </>
        )}
        
        {searchQuery && !selectedBrandName && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbPage>Поиск: "{searchQuery}"</BreadcrumbPage>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CatalogBreadcrumb;
