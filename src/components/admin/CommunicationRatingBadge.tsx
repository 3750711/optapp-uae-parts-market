
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from 'lucide-react';

interface CommunicationRatingBadgeProps {
  rating: number | null;
  size?: 'sm' | 'md';
}

export const CommunicationRatingBadge = ({ rating, size = 'md' }: CommunicationRatingBadgeProps) => {
  if (rating === null) {
    return (
      <Badge variant="outline" className={size === 'sm' ? 'text-xs px-1 py-0' : ''}>
        <MessageCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
        N/A
      </Badge>
    );
  }

  const getVariant = (rating: number) => {
    if (rating <= 2) return 'destructive';
    if (rating === 3) return 'secondary';
    return 'default';
  };

  const getText = (rating: number) => {
    switch (rating) {
      case 1: return 'Очень сложно';
      case 2: return 'Сложно';
      case 3: return 'Средне';
      case 4: return 'Легко';
      case 5: return 'Очень легко';
      default: return 'N/A';
    }
  };

  return (
    <Badge 
      variant={getVariant(rating)} 
      className={size === 'sm' ? 'text-xs px-1 py-0' : ''}
    >
      <MessageCircle className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
      {rating}/5 - {getText(rating)}
    </Badge>
  );
};
