
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Car, CarFront } from 'lucide-react';

interface CarBrand {
  id: string;
  name: string;
  models: Array<{ id: string; name: string }>;
}

interface StoreAboutTabProps {
  description?: string;
  carBrandsData?: CarBrand[];
}

const StoreAboutTab: React.FC<StoreAboutTabProps> = ({
  description,
  carBrandsData
}) => {
  return (
    <div className="space-y-6">
      {description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Описание</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </CardContent>
        </Card>
      )}
      
      {carBrandsData && carBrandsData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Car className="w-5 h-5 mr-2" />
              Марки и модели автомобилей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {carBrandsData.map((brand) => (
                <div key={brand.id} className="bg-muted/30 rounded-lg p-4 border">
                  <div className="flex items-center mb-3">
                    <CarFront className="w-4 h-4 mr-2 text-primary" />
                    <span className="font-medium">{brand.name}</span>
                  </div>
                  {brand.models && brand.models.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {brand.models.map((model) => (
                        <Badge 
                          key={model.id} 
                          variant="secondary"
                          className="text-xs"
                        >
                          {model.name}
                        </Badge>
                      ))}
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
};

export default StoreAboutTab;
