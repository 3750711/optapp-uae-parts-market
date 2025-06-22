
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Star, MessageCircle, Phone, User, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/SimpleAuthContext';

interface SellerInfoProps {
  seller: {
    id: string;
    full_name: string | null;
    opt_id: string | null;
    telegram: string | null;
    phone: string | null;
    verification_status: string | null;
    communication_ability: number | null;
    description_user: string | null;
  };
  showContactInfo?: boolean;
}

export const SellerInfo: React.FC<SellerInfoProps> = ({ seller, showContactInfo = false }) => {
  const { user } = useAuth();
  const isOwner = user?.id === seller.id;

  const getVerificationBadge = (status: string | null) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Проверен</Badge>;
      case 'pending':
        return <Badge variant="secondary">На проверке</Badge>;
      case 'blocked':
        return <Badge variant="destructive">Заблокирован</Badge>;
      default:
        return <Badge variant="outline">Не проверен</Badge>;
    }
  };

  const renderRating = (rating: number | null) => {
    if (!rating) return null;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`h-4 w-4 ${i <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
        />
      );
    }
    return <div className="flex items-center space-x-1">{stars}</div>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Информация о продавце</span>
          </div>
          {getVerificationBadge(seller.verification_status)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="font-medium">{seller.full_name || 'Имя не указано'}</p>
          <p className="text-sm text-gray-500">OPT ID: {seller.opt_id || 'Не указан'}</p>
        </div>

        {seller.communication_ability && (
          <div>
            <p className="text-sm text-gray-500 mb-1">Рейтинг общения</p>
            {renderRating(seller.communication_ability)}
          </div>
        )}

        {seller.description_user && (
          <>
            <Separator />
            <div>
              <p className="text-sm text-gray-500 mb-1">О продавце</p>
              <p className="text-sm">{seller.description_user}</p>
            </div>
          </>
        )}

        {(showContactInfo || isOwner) && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Контакты</p>
              {seller.telegram && (
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">@{seller.telegram}</span>
                </div>
              )}
              {seller.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{seller.phone}</span>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SellerInfo;
