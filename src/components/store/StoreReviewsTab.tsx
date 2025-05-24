
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, User } from 'lucide-react';
import { StoreReview } from '@/types/store';

interface StoreReviewsTabProps {
  reviews?: StoreReview[];
  isReviewsLoading: boolean;
}

const StoreReviewsTab: React.FC<StoreReviewsTabProps> = ({
  reviews,
  isReviewsLoading
}) => {
  if (isReviewsLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <p className="text-muted-foreground">У этого магазина пока нет отзывов</p>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <Card key={review.id}>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <div className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={review.user_avatar} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <span>{review.user_name || 'Пользователь'}</span>
              </div>
              <div className="flex items-center">
                {Array.from({ length: review.rating || 0 }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          {review.comment && (
            <CardContent>
              <p>{review.comment}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default StoreReviewsTab;
