
import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, CarFront, Building2 } from 'lucide-react';

interface CarBrand {
  id: string;
  name: string;
  models: Array<{ id: string; name: string }>;
}

interface StoreAboutTabProps {
  description?: string;
  carBrandsData?: CarBrand[];
}

const StoreAboutTab: React.FC<StoreAboutTabProps> = memo(({
  description,
  carBrandsData
}) => {
  return (
    <div className="space-y-6">
      {description && (
        <Card className="animate-slide-in-from-left shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Описание
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground leading-relaxed text-base whitespace-pre-wrap">
                {description}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      {carBrandsData && carBrandsData.length > 0 && (
        <Card className="animate-slide-in-from-right shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl flex items-center gap-2">
              <Car className="w-5 h-5 text-primary" />
              Марки и модели автомобилей
              <Badge variant="secondary" className="ml-2">
                {carBrandsData.length} {carBrandsData.length === 1 ? 'марка' : 'марок'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {carBrandsData.map((brand, index) => (
                <div 
                  key={brand.id} 
                  className="group bg-gradient-to-br from-muted/30 to-muted/10 rounded-lg p-4 border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-sm animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 group-hover:bg-primary/20 transition-colors">
                      <CarFront className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {brand.name}
                    </span>
                  </div>
                  {brand.models && brand.models.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {brand.models.slice(0, 6).map((model) => (
                        <Badge 
                          key={model.id} 
                          variant="secondary"
                          className="text-xs hover:bg-primary/10 transition-colors cursor-default"
                        >
                          {model.name}
                        </Badge>
                      ))}
                      {brand.models.length > 6 && (
                        <Badge variant="outline" className="text-xs">
                          +{brand.models.length - 6} еще
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Все модели
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});

StoreAboutTab.displayName = 'StoreAboutTab';

export default StoreAboutTab;
