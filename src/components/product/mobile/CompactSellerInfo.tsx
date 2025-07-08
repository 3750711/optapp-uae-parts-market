import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Shield, ShieldCheck, Star, MessageCircle, Phone, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import ContactButtons from "@/components/product/ContactButtons";
import { AuthDialog } from "@/components/product/seller/AuthDialog";
import { useNavigate } from "react-router-dom";

interface CompactSellerInfoProps {
  sellerProfile: any;
  sellerName: string;
  sellerId: string;
  productTitle: string;
  productId: string;
}

const CompactSellerInfo: React.FC<CompactSellerInfoProps> = ({
  sellerProfile,
  sellerName,
  sellerId,
  productTitle,
  productId,
}) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleShowContactInfo = () => {
    if (!user) {
      setShowAuthDialog(true);
    } else {
      setShowContacts(true);
    }
  };

  const handleGoToLogin = () => {
    setShowAuthDialog(false);
    navigate('/login', {
      state: {
        returnPath: window.location.pathname
      }
    });
  };

  const getVerificationBadge = () => {
    switch (sellerProfile?.opt_status) {
      case 'verified':
        return (
          <Badge variant="success" className="text-xs">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Проверен
          </Badge>
        );
      case 'opt_user':
        return (
          <Badge variant="info" className="text-xs">
            <Shield className="h-3 w-3 mr-1" />
            OPT
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            <User className="h-3 w-3 mr-1" />
            Базовый
          </Badge>
        );
    }
  };

  const getCommunicationRating = () => {
    const rating = sellerProfile?.communication_ability || 3;
    return (
      <div className="flex items-center gap-1">
        <MessageCircle className="h-4 w-4 text-blue-600" />
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-3 w-3 ${
                i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-1">{rating}/5</span>
      </div>
    );
  };

  return (
    <Card className="rounded-none border-0 shadow-none">
      <CardContent className="p-4 space-y-4">
        {/* Seller Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">{sellerName}</h3>
            {getVerificationBadge()}
            {sellerProfile?.opt_id && (
              <div className="text-xs text-muted-foreground">
                OPT ID: {sellerProfile.opt_id}
              </div>
            )}
          </div>
          
          {sellerProfile?.rating && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-semibold text-sm">{sellerProfile.rating}</span>
              </div>
              <div className="text-xs text-muted-foreground">Рейтинг</div>
            </div>
          )}
        </div>

        {/* Communication Rating */}
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-sm font-medium text-blue-900 mb-1">
            Качество коммуникации
          </div>
          {getCommunicationRating()}
        </div>

        {/* Description */}
        {sellerProfile?.description_user && (
          <div>
            <h4 className="font-medium text-sm mb-2">О продавце</h4>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {sellerProfile.description_user}
            </p>
          </div>
        )}

        {/* Contact Section */}
        <div className="space-y-3">
          {!showContacts ? (
            <Button 
              onClick={handleShowContactInfo}
              className="w-full"
              size="sm"
            >
              <Phone className="h-4 w-4 mr-2" />
              Связаться с продавцом
            </Button>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium text-center mb-3">
                Контакты продавца
              </div>
              <ContactButtons 
                sellerPhone={sellerProfile?.phone}
                sellerTelegram={sellerProfile?.telegram}
                productTitle={productTitle}
                isVerified={sellerProfile?.opt_status === 'verified'}
                verificationStatus={sellerProfile?.opt_status || 'pending'}
              />
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="bg-yellow-50 p-3 rounded-lg">
          <div className="text-xs text-yellow-800">
            💡 <strong>Совет:</strong> Всегда проверяйте товар перед покупкой. 
            Рекомендуем встречаться в безопасных местах.
          </div>
        </div>

        <AuthDialog 
          open={showAuthDialog}
          onOpenChange={setShowAuthDialog}
          onGoToLogin={handleGoToLogin}
        />
      </CardContent>
    </Card>
  );
};

export default CompactSellerInfo;