
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href?: string;
}

interface AdminBreadcrumbsProps {
  items?: BreadcrumbItem[];
}

export const AdminBreadcrumbs: React.FC<AdminBreadcrumbsProps> = ({ items = [] }) => {
  const location = useLocation();
  
  // Auto-generate breadcrumbs based on current path if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbItem[] = [{ name: 'Главная', href: '/admin' }];
    
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      if (segment === 'admin') return;
      
      const isLast = index === pathSegments.length - 1;
      const name = segment === 'orders' ? 'Заказы' : 
                   segment === 'products' ? 'Товары' :
                   segment === 'users' ? 'Пользователи' :
                   segment === 'stores' ? 'Магазины' :
                   segment.charAt(0).toUpperCase() + segment.slice(1);
      
      breadcrumbs.push({
        name,
        href: isLast ? undefined : currentPath
      });
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = items.length > 0 ? items : generateBreadcrumbs();

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-4" aria-label="Breadcrumb">
      <Home className="h-4 w-4" />
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="h-4 w-4" />}
          {item.href ? (
            <Link 
              to={item.href} 
              className="hover:text-primary transition-colors"
            >
              {item.name}
            </Link>
          ) : (
            <span className="text-foreground font-medium">{item.name}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};
