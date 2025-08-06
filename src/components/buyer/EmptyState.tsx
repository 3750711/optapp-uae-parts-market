import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  actionTo: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo
}) => {
  return (
    <div className="text-center py-16">
      <div className="mx-auto w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
        <Icon className="h-12 w-12 text-slate-400" />
      </div>
      
      <h3 className="text-xl font-semibold text-slate-800 mb-2">
        {title}
      </h3>
      
      <p className="text-slate-600 mb-8 max-w-md mx-auto">
        {description}
      </p>
      
      <Button asChild className="bg-blue-600 hover:bg-blue-700">
        <Link to={actionTo}>
          {actionLabel}
        </Link>
      </Button>
    </div>
  );
};