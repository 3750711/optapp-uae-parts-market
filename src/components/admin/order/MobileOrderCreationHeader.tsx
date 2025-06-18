
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';

interface MobileOrderCreationHeaderProps {
  title: string;
  description?: string;
}

export const MobileOrderCreationHeader: React.FC<MobileOrderCreationHeaderProps> = ({
  title,
  description
}) => {
  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Package className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-blue-900">{title}</h1>
            {description && (
              <p className="text-sm text-blue-700 mt-1">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
