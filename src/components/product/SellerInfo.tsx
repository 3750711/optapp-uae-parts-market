import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, MessageCircle, Phone, Store } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';
import { Link } from 'react-router-dom';

interface SellerInfoProps {
  sellerName: string;
  sellerProfile: any;
  productId: string;
}

const SellerInfo: React.FC<SellerInfoProps> = ({ sellerName, sellerProfile, productId }) => {
  const { user } = useAuth();
  const [isContacting, setIsContacting] = useState(false);

  const handleContactSeller = () => {
    setIsContacting(true);
    // Add logic to initiate contact with the seller
    setTimeout(() => {
      setIsContacting(false);
    }, 2000);
  };

  return (
    <Card className="bg-white shadow-md rounded-md">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Информация о продавце</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-gray-800 font-medium">{sellerName}</div>
            {sellerProfile && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Star className="h-4 w-4" />
                <span>{sellerProfile.rating || 'Нет оценок'}</span>
              </div>
            )}
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to={`/public-seller-profile/${sellerProfile?.id}`}>
              <Store className="h-4 w-4 mr-2" />
              Магазин
            </Link>
          </Button>
        </div>
        <div className="flex space-x-4">
          <Button
            variant="ghost"
            size="sm"
            className="w-1/2 justify-center"
            onClick={handleContactSeller}
            disabled={isContacting}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Написать
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-1/2 justify-center"
            onClick={handleContactSeller}
            disabled={isContacting}
          >
            <Phone className="h-4 w-4 mr-2" />
            Позвонить
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerInfo;
