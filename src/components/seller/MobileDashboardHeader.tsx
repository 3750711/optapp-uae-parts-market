import React from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface MobileDashboardHeaderProps {
  userName: string | null;
  userAvatar?: string | null;
  className?: string;
}

const getInitials = (name: string | null | undefined): string => {
  if (!name) return 'S';
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const MobileDashboardHeader: React.FC<MobileDashboardHeaderProps> = ({
  userName,
  userAvatar,
  className
}) => {
  return (
    <div className={cn(
      "flex items-center gap-4 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl",
      "border border-primary/10",
      className
    )}>
      <Link to="/seller/profile" className="group">
        <Avatar className="h-16 w-16 border-2 border-primary/20 cursor-pointer transition-all duration-200 group-hover:border-primary/40 group-hover:scale-105">
          <AvatarImage src={userAvatar || undefined} alt={userName || 'Seller'} />
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold group-hover:bg-primary/20">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
      </Link>
      
      <div className="flex-1 min-w-0">
        <h1 className="text-2xl font-bold text-foreground truncate">
          Добро пожаловать
        </h1>
        <p className="text-lg text-muted-foreground truncate">
          {userName || 'Продавец'}
        </p>
      </div>
    </div>
  );
};