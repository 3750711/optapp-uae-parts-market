import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Plus, Bell, Search, Store } from 'lucide-react';

export const QuickActionsSection: React.FC = () => {
  const quickActions = [
    {
      to: "/create-request",
      icon: Plus,
      label: "Создать запрос",
      variant: "default" as const
    },
    {
      to: "/catalog",
      icon: Search,
      label: "Каталог",
      variant: "outline" as const
    },
    {
      to: "/notifications",
      icon: Bell,
      label: "Уведомления",
      variant: "outline" as const
    },
    {
      to: "/stores",
      icon: Store,
      label: "Магазины",
      variant: "outline" as const
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Быстрые действия</h3>
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => (
          <Button
            key={action.to}
            variant={action.variant}
            size="sm"
            asChild
            className="flex-1 sm:flex-none"
          >
            <Link to={action.to} className="flex items-center gap-2">
              <action.icon className="h-4 w-4" />
              {action.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  );
};