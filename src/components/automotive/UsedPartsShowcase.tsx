
import React, { useEffect, useState } from 'react';
import { generateAutomotiveImage, automotiveImageTypes } from '@/utils/automotiveImageGenerator';
import { AutomotiveCard } from '@/components/ui/automotive-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wrench, RefreshCw, Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsedPartItem {
  type: 'used_parts' | 'used_engine' | 'used_transmission' | 'used_suspension' | 'used_electrical';
  title: string;
  condition: 'excellent' | 'good' | 'fair';
  price: string;
}

const usedPartsData: UsedPartItem[] = [
  { type: 'used_engine', title: 'Двигатель V6', condition: 'excellent', price: 'от 15,000 AED' },
  { type: 'used_transmission', title: 'КПП Автомат', condition: 'good', price: 'от 8,500 AED' },
  { type: 'used_suspension', title: 'Подвеска', condition: 'excellent', price: 'от 3,200 AED' },
  { type: 'used_electrical', title: 'Генератор', condition: 'good', price: 'от 850 AED' },
];

const conditionColors = {
  excellent: 'bg-green-100 text-green-800 border-green-200',
  good: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  fair: 'bg-orange-100 text-orange-800 border-orange-200'
};

const conditionLabels = {
  excellent: 'Отличное',
  good: 'Хорошее',
  fair: 'Удовл.'
};

export const UsedPartsShowcase: React.FC = () => {
  const [images, setImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const generateImage = async (partType: UsedPartItem['type']) => {
    setLoading(prev => ({ ...prev, [partType]: true }));
    try {
      const result = await generateAutomotiveImage(partType);
      setImages(prev => ({ ...prev, [partType]: result.image }));
    } catch (error) {
      console.error(`Failed to generate image for ${partType}:`, error);
    } finally {
      setLoading(prev => ({ ...prev, [partType]: false }));
    }
  };

  useEffect(() => {
    // Generate initial images for all parts
    usedPartsData.forEach(part => generateImage(part.type));
  }, []);

  return (
    <section className="py-16 bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <Wrench className="w-8 h-8 text-accent-automotive" />
            <h2 className="text-4xl font-bold bg-gradient-automotive bg-clip-text text-transparent">
              Профессиональные Б/У Запчасти
            </h2>
            <CheckCircle className="w-8 h-8 text-accent-automotive" />
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Высококачественные подержанные автозапчасти с гарантией качества и профессиональной проверкой
          </p>
        </div>

        {/* Parts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {usedPartsData.map((part) => (
            <AutomotiveCard key={part.type} hover3d className="overflow-hidden">
              {/* Image Section */}
              <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
                {loading[part.type] ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-accent-automotive" />
                  </div>
                ) : images[part.type] ? (
                  <img 
                    src={images[part.type]} 
                    alt={part.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <Wrench className="w-12 h-12" />
                  </div>
                )}
                
                {/* Condition Badge */}
                <Badge 
                  className={cn(
                    "absolute top-3 right-3 font-medium",
                    conditionColors[part.condition]
                  )}
                >
                  {conditionLabels[part.condition]}
                </Badge>

                {/* Quality Stars */}
                <div className="absolute bottom-3 left-3 flex gap-1">
                  {[...Array(part.condition === 'excellent' ? 5 : part.condition === 'good' ? 4 : 3)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>

              {/* Content Section */}
              <div className="p-6">
                <h3 className="font-semibold text-lg mb-2">{part.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {automotiveImageTypes[part.type]}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-accent-automotive">{part.price}</span>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => generateImage(part.type)}
                    disabled={loading[part.type]}
                    className="hover:bg-accent-automotive hover:text-white"
                  >
                    {loading[part.type] ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </AutomotiveCard>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-gradient-automotive hover:shadow-glow text-white px-8 py-4 text-lg rounded-xl"
          >
            <Wrench className="w-6 h-6 mr-3" />
            Посмотреть весь каталог б/у запчастей
            <CheckCircle className="w-6 h-6 ml-3" />
          </Button>
        </div>
      </div>
    </section>
  );
};
