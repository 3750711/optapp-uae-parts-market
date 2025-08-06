import React from 'react';
import { Link } from 'react-router-dom';
import { useSimpleBuyerOffers } from '@/hooks/useSimpleBuyerOffers';
import { SimpleProductCard } from '@/components/product/SimpleProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { formatPrice } from '@/utils/formatPrice';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export const MyOffersSection: React.FC = () => {
  const { data: offerProducts, isLoading } = useSimpleBuyerOffers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Мои предложения
          </h3>
          <Skeleton className="h-4 w-20" />
        </div>
        <Carousel className="w-full">
          <CarouselContent className="-ml-2 md:-ml-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <CarouselItem key={i} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
                <div className="space-y-2">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    );
  }

  const recentOffers = offerProducts?.slice(0, 4) || [];

  if (recentOffers.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Мои предложения
          </h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>У вас пока нет предложений</p>
          <Link 
            to="/catalog" 
            className="text-primary hover:text-primary/80 transition-colors"
          >
            Сделать первое предложение
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Ожидает</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-100 text-green-800">Принято</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонено</Badge>;
      case 'expired':
        return <Badge variant="outline">Истекло</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Мои предложения
        </h3>
        <Link 
          to="/buyer-price-offers" 
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Посмотреть все ({offerProducts?.length || 0}) →
        </Link>
      </div>
      <Carousel className="w-full">
        <CarouselContent className="-ml-2 md:-ml-4">
          {recentOffers.map((product) => (
            <CarouselItem key={product.id} className="pl-2 md:pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/6">
              <div className="space-y-2">
                <SimpleProductCard product={{
                  ...product,
                  seller_name: product.seller_name || 'Unknown Seller'
                }} />
                <div className="px-3 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Ваше предложение:</span>
                    {getStatusBadge(product.user_offer_status)}
                  </div>
                  <div className="font-medium text-sm text-primary">
                    {formatPrice(product.user_offer_price || 0)}
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
};