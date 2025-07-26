import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardItem {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  onClick?: () => void;
}

interface OptimizedDashboardGridProps {
  items: DashboardItem[];
  className?: string;
}

export const OptimizedDashboardGrid: React.FC<OptimizedDashboardGridProps> = ({ 
  items, 
  className 
}) => {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
      "auto-rows-fr", // Equal height rows
      className
    )}>
      {items.map((item, index) => {
        if (item.onClick) {
          return (
            <button
              key={`${item.title}-${index}`}
              onClick={item.onClick}
              type="button"
              className={cn(
                // Base styles
                "group relative flex flex-col p-6 rounded-xl border transition-all duration-200",
                "bg-card text-card-foreground shadow-sm",
                // Mobile optimizations
                "min-h-[120px] sm:min-h-[140px]", // Consistent height
                "touch-manipulation", // Better touch handling
                "active:scale-[0.98]", // Touch feedback
                // Hover effects
                "hover:shadow-md hover:border-primary/20",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                // Accessibility
                "cursor-pointer select-none",
                item.bgColor
              )}
              aria-label={`${item.title}: ${item.description}`}
            >
              {/* Icon */}
              <div className={cn(
                "flex items-center justify-center w-12 h-12 rounded-lg mb-4",
                "transition-transform duration-200 group-hover:scale-110",
                "bg-primary/10"
              )}>
                <item.icon className={cn("h-6 w-6", item.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 text-left">
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Hover indicator */}
              <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
            </button>
          );
        }

        return (
          <Link
            key={`${item.title}-${index}`}
            to={item.href}
            className={cn(
              // Base styles
              "group relative flex flex-col p-6 rounded-xl border transition-all duration-200",
              "bg-card text-card-foreground shadow-sm",
              // Mobile optimizations
              "min-h-[120px] sm:min-h-[140px]", // Consistent height
              "touch-manipulation", // Better touch handling
              "active:scale-[0.98]", // Touch feedback
              // Hover effects
              "hover:shadow-md hover:border-primary/20",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              // Accessibility
              "cursor-pointer select-none",
              item.bgColor
            )}
            aria-label={`${item.title}: ${item.description}`}
          >
            {/* Icon */}
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg mb-4",
              "transition-transform duration-200 group-hover:scale-110",
              "bg-primary/10"
            )}>
              <item.icon className={cn("h-6 w-6", item.color)} />
            </div>

            {/* Content */}
            <div className="flex-1 text-left">
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Hover indicator */}
            <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
          </Link>
        );
      })}
    </div>
  );
};