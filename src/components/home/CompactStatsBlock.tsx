import React, { useEffect, useState } from 'react';
import { Package, ShoppingBag, CheckCircle2, Star, Truck, Shield, LogIn, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useStatistics } from '@/hooks/useStatistics';
import { AutomotiveCard } from '@/components/ui/automotive-card';
import { Button } from '@/components/ui/button';
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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
      <AutomotiveCard className="max-w-md mx-auto animate-pulse">
        <div className="h-32 bg-muted rounded"></div>
      </AutomotiveCard>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: 'center',
        }}
        className="w-full"
      >
        <CarouselContent>
          {/* Слайд 1: Статистика */}
          <CarouselItem>
            <AutomotiveCard 
              metallic 
              glowing 
              className="transition-all duration-300"
            >
              <div className="flex items-center justify-around p-6">
                {/* Parts Statistics */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    {stats?.totalProducts?.toLocaleString() || '1373'}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">
                    Автозапчастей
                  </p>
                </div>
                
                {/* Vertical Divider */}
                <div className="h-16 w-px bg-gradient-to-b from-transparent via-border to-transparent"></div>
                
                {/* Orders Statistics */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-2">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                    {stats?.lastOrderNumber?.toLocaleString() || '7774'}
                  </div>
                  <p className="text-xs md:text-sm text-muted-foreground font-medium">
                    Заказов создано
                  </p>
                </div>
              </div>
            </AutomotiveCard>
          </CarouselItem>

          {/* Слайд 2: О платформе */}
          <CarouselItem>
            <AutomotiveCard 
              metallic 
              glowing 
              className="transition-all duration-300"
            >
              <div className="p-6 text-center">
                <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                  PartsBay.ae
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Легко найти запчасти в ОАЭ
                </p>
                
                {/* Преимущества в виде grid */}
                <div className="grid grid-cols-2 gap-3 text-left">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-foreground">Проверенные продавцы</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Star className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-foreground">Отзывы покупателей</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-foreground">Cargo доставка</span>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-foreground">Проверка качества</span>
                  </div>
                </div>
              </div>
            </AutomotiveCard>
          </CarouselItem>

          {/* Слайд 3: CTA для авторизации (только для неавторизованных) */}
          {!user && (
            <CarouselItem>
              <AutomotiveCard 
                metallic 
                glowing 
                className="transition-all duration-300"
              >
                <div className="p-6 text-center">
                  {/* Иконка */}
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                    <LogIn className="w-8 h-8 text-primary" />
                  </div>
                  
                  {/* Заголовок */}
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                    Начните работу
                  </h3>
                  
                  {/* Подзаголовок */}
                  <p className="text-sm text-muted-foreground mb-6">
                    Получите полный доступ к платформе
                  </p>
                  
                  {/* Кнопки */}
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      onClick={() => navigate('/login')}
                      variant="default"
                      size="default"
                      className="gap-2"
                    >
                      <LogIn className="w-4 h-4" />
                      Войти
                    </Button>
                    
                    <Button
                      onClick={() => navigate('/register')}
                      variant="outline"
                      size="default"
                      className="gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Регистрация
                    </Button>
                  </div>
                </div>
              </AutomotiveCard>
            </CarouselItem>
          )}
        </CarouselContent>
      </Carousel>

      {/* Индикаторы слайдов (dots) */}
      <div className="flex justify-center gap-2 mt-4">
        {(user ? [0, 1] : [0, 1, 2]).map((index) => (
          <button
            key={index}
            onClick={() => api?.scrollTo(index)}
            className={`h-2 rounded-full transition-all duration-300 ${
              current === index 
                ? 'w-8 bg-primary' 
                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Перейти к слайду ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
