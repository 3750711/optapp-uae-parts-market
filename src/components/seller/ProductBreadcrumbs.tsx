
import React from "react";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface ProductBreadcrumbsProps {
  items: BreadcrumbItem[];
}

const ProductBreadcrumbs = React.memo(({ items }: ProductBreadcrumbsProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      <Link 
        to="/seller/dashboard" 
        className="flex items-center hover:text-primary transition-colors"
      >
        <Home className="h-4 w-4 mr-1" />
        Home
      </Link>
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-primary transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
});

ProductBreadcrumbs.displayName = "ProductBreadcrumbs";

export default ProductBreadcrumbs;
