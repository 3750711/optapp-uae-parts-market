
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
import { Home, Package } from 'lucide-react';

interface ProductBreadcrumbProps {
  productTitle: string;
  brand?: string;
  model?: string;
  categoryName?: string;
}

const ProductBreadcrumb: React.FC<ProductBreadcrumbProps> = ({
  productTitle,
  brand,
  model,
  categoryName = "Автозапчасти"
}) => {
  // Укорачиваем название товара для breadcrumb
  const shortTitle = productTitle.length > 50 
    ? `${productTitle.substring(0, 50)}...` 
    : productTitle;

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
            <Link to="/catalog" className="text-muted-foreground hover:text-foreground transition-colors">
              Каталог
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        <BreadcrumbSeparator />
        
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/catalog" className="text-muted-foreground hover:text-foreground transition-colors">
              {categoryName}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {brand && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  to={`/catalog?brand=${encodeURIComponent(brand)}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {brand}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        
        {brand && model && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link 
                  to={`/catalog?brand=${encodeURIComponent(brand)}&model=${encodeURIComponent(model)}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {model}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        
        <BreadcrumbSeparator />
        
        <BreadcrumbPage className="flex items-center text-foreground">
          <Package className="h-4 w-4 mr-1" />
          {shortTitle}
        </BreadcrumbPage>
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default ProductBreadcrumb;
