import React, { useEffect, useState } from 'react';
import { Package, ShoppingBag, CheckCircle2, Star, Truck, Shield } from 'lucide-react';
import { useStatistics } from '@/hooks/useStatistics';
import { AutomotiveCard } from '@/components/ui/automotive-card';
import { getMainPageTranslations } from '@/utils/mainPageTranslations';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';

interface CompactStatsBlockProps {
  language?: 'ru' | 'en' | 'bn';
}

export const CompactStatsBlock: React.FC<CompactStatsBlockProps> = ({ language = 'ru' }) => {
  const { data: stats, isLoading } = useStatistics();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const t = getMainPageTranslations(language);

  // Автоплей каждые 5 секунд
  useEffect(() => {
    if (!api) return;
    
    const interval = setInterval(() => {
      api.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [api]);

  // Отслеживание текущего слайда
  useEffect(() => {
    if (!api) return;

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  if (isLoading) {
    return (
      <AutomotiveCard className="max-w-md mx-auto">
        <div className="min-h-[160px] flex items-center justify-center">
          <div 
            className="w-full h-32 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted rounded animate-shimmer" 
            style={{ backgroundSize: '200% 100%' }}
          />
        </div>
      </AutomotiveCard>
    );
  }

  return (
    <div className="max-w-md mx-auto relative">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: 'center',
        }}
        className="w-full perspective-1000"
      >
        <CarouselContent>
          {/* Слайд 1: Статистика */}
          <CarouselItem>
            <AutomotiveCard 
              className="bg-background border-border group transition-all duration-500 hover:scale-[1.02] hover:shadow-card hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <div className="min-h-[160px] flex items-center justify-center">
                <div className="flex items-center justify-around w-full px-6">
                  {/* Parts Statistics */}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                      <Package className="w-6 h-6 text-primary transition-all duration-500 group-hover:rotate-12 group-hover:scale-110" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 transition-all duration-300 group-hover:scale-110 group-hover:text-primary">
                      {stats?.totalProducts?.toLocaleString() || '1373'}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">
                      {t.stats.partsCount}
                    </p>
                  </div>
                  
                  {/* Vertical Divider */}
                  <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
                  
                  {/* Orders Statistics */}
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                      <ShoppingBag className="w-6 h-6 text-primary transition-all duration-500 group-hover:-rotate-12 group-hover:scale-110" />
                    </div>
                    <div className="text-2xl md:text-3xl font-bold text-foreground mb-1 transition-all duration-300 group-hover:scale-110 group-hover:text-primary">
                      {stats?.lastOrderNumber?.toLocaleString() || '7774'}
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground font-medium">
                      {t.stats.ordersCount}
                    </p>
                  </div>
                </div>
              </div>
            </AutomotiveCard>
          </CarouselItem>

          {/* Слайд 2: О платформе */}
          <CarouselItem>
            <AutomotiveCard 
              className="bg-background border-border group transition-all duration-500 hover:scale-[1.02] hover:shadow-card hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:transform-none"
            >
              <div className="min-h-[160px] flex items-center justify-center">
                <div className="px-6 py-4 text-center w-full">
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                    {t.stats.platformTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.stats.platformSubtitle}
                  </p>
                  
                  {/* Преимущества с staggered animation */}
                  <div className="grid grid-cols-2 gap-3 text-left">
                    {[
                      { icon: CheckCircle2, text: t.stats.trustedSellers },
                      { icon: Star, text: t.stats.buyerReviews },
                      { icon: Truck, text: t.stats.cargoDelivery },
                      { icon: Shield, text: t.stats.qualityCheck },
                    ].map((item, index) => {
                      const Icon = item.icon;
                      return (
                        <div 
                          key={index}
                          className="flex items-start gap-2 opacity-0 animate-fade-in"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0 transition-transform duration-300 hover:scale-125 hover:rotate-6" />
                          <span className="text-xs text-foreground">{item.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </AutomotiveCard>
          </CarouselItem>

        </CarouselContent>
      </Carousel>

    </div>
  );
};
