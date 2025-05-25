
import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ProfileType } from '@/components/profile/types';

interface UserAvatarProps {
  user: ProfileType;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  user, 
  size = 'md',
  className = ''
}) => {
  const getInitials = (name: string | null | undefined): string => {
    if (!name) return 'Н/Д';
    
    const words = name.trim().split(' ');
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  };

  const getAvatarBgColor = (userType: string): string => {
    switch (userType) {
      case 'admin':
        return 'bg-purple-500';
      case 'seller':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || 'User'} />
      <AvatarFallback className={`${getAvatarBgColor(user.user_type)} text-white font-semibold`}>
        {getInitials(user.full_name)}
      </AvatarFallback>
    </Avatar>
  );
};
