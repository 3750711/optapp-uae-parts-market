
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
import { Home, Store } from 'lucide-react';

interface StoreBreadcrumbProps {
  storeName: string;
  storeLocation?: string;
}

const StoreBreadcrumb: React.FC<StoreBreadcrumbProps> = ({
  storeName,
  storeLocation
}) => {
  const shortStoreName = storeName.length > 40 
    ? `${storeName.substring(0, 40)}...` 
    : storeName;

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <Home className="h-4 w-4 mr-1" />
              Главная
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/stores" className="text-muted-foreground hover:text-foreground transition-colors">
              Магазины
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {storeLocation && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  to={`/stores?location=${encodeURIComponent(storeLocation)}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {storeLocation}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        
        <BreadcrumbSeparator />
        
        <BreadcrumbPage className="flex items-center text-foreground">
          <Store className="h-4 w-4 mr-1" />
          {shortStoreName}
        </BreadcrumbPage>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default StoreBreadcrumb;
