
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, User, MessageSquare } from 'lucide-react';
import { StoreReview } from '@/types/store';

interface StoreReviewsTabProps {
  reviews?: StoreReview[];
  isReviewsLoading: boolean;
}

const StoreReviewsTab: React.FC<StoreReviewsTabProps> = memo(({
  reviews,
  isReviewsLoading
}) => {
  if (isReviewsLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="w-4 h-4" />
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-12 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 bg-muted rounded-full flex items-center justify-center">
          <MessageSquare className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">
          У этого магазина пока нет отзывов
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Станьте первым, кто оставит отзыв о работе с этим магазином
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {reviews.map((review, index) => (
        <Card 
          key={review.id}
          className="shadow-sm hover:shadow-md transition-all duration-300 border hover:border-primary/20 animate-slide-in-from-bottom"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-muted">
                  <AvatarImage src={review.user_avatar} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-base font-medium">
                    {review.user_name || 'Пользователь'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString('ru-RU', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 transition-colors ${
                      i < (review.rating || 0) 
                        ? 'fill-yellow-400 text-yellow-400' 
                        : 'text-muted-foreground/30'
                    }`}
                  />
                ))}
                <span className="ml-2 text-sm font-medium text-muted-foreground">
                  {review.rating}/5
                </span>
              </div>
            </div>
          </CardHeader>
          {review.comment && (
            <CardContent className="pt-0">
              <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary/30">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {review.comment}
                </p>
              </div>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
});

StoreReviewsTab.displayName = 'StoreReviewsTab';

export default StoreReviewsTab;
