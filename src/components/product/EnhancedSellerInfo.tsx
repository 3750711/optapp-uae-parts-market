import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Shield, ShieldCheck, MessageCircle, Star, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SellerProfile } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { SellerDescription } from "./seller/SellerDescription";
import { SellerContactSection } from "./seller/SellerContactSection";
import { SellerHelpSection } from "./seller/SellerHelpSection";
import { AuthDialog } from "./seller/AuthDialog";

interface EnhancedSellerInfoProps {
  sellerProfile?: SellerProfile | null;
  seller_name: string;
  seller_id: string;
  children?: React.ReactNode;
}

const EnhancedSellerInfo: React.FC<EnhancedSellerInfoProps> = ({
  sellerProfile,
  seller_name,
  seller_id,
  children
}) => {
  const [storeInfo, setStoreInfo] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStoreInfo = async () => {
      if (!seller_id) return;
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, name')
          .eq('seller_id', seller_id)
          .maybeSingle();

        if (!error && data) {
          setStoreInfo(data);
        }
      } catch (error) {
        console.error("Error fetching store info:", error);
      }
    };

    fetchStoreInfo();
  }, [seller_id]);

  const handleShowContactInfo = () => {
    if (!user) {
      setShowAuthDialog(true);
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

  const copyToClipboard = (text: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        toast({
          title: "Скопировано!",
          description: "OPT ID скопирован в буфер обмена"
        });
        setTimeout(() => setCopied(false), 2000);
      });
    } catch (err) {
      console.error("Failed to copy:", err);
      toast({
        variant: "destructive",
        title: "Ошибка",
        description: "Не удалось скопировать OPT ID"
      });
    }
  };

  const getVerificationBadge = () => {
    switch (sellerProfile?.opt_status) {
      case 'verified':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Проверенный продавец
          </Badge>
        );
      case 'opt_user':
        return (
          <Badge variant="info" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            OPT пользователь
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <User className="h-3 w-3" />
            Базовый пользователь
          </Badge>
        );
    }
  };

  const getCommunicationRating = () => {
    const rating = sellerProfile?.communication_ability || 3;
    return (
      <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <MessageCircle className="h-5 w-5 text-blue-600" />
        <div>
          <div className="text-sm font-medium text-blue-900">
            Качество коммуникации
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${
                  i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
            <span className="text-xs text-blue-700 ml-1">
              {rating}/5 - {rating >= 4 ? 'Отличное' : rating >= 3 ? 'Хорошее' : 'Среднее'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow bg-white">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <User className="h-5 w-5 mr-2 text-primary" />
        Информация о продавце
      </h3>
      
      <div className="space-y-4">
        {/* Seller basic info with enhanced verification */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h4 className="font-medium text-lg">{seller_name}</h4>
            {getVerificationBadge()}
            {sellerProfile?.opt_id && (
              <div className="text-sm text-muted-foreground">
                OPT ID: {sellerProfile.opt_id}
                <button
                  onClick={() => copyToClipboard(sellerProfile.opt_id!)}
                  className="ml-2 text-primary hover:underline"
                >
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
              </div>
            )}
          </div>
          
          {/* Enhanced rating display */}
          {sellerProfile?.rating && (
            <div className="text-right">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-semibold">{sellerProfile.rating}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                Рейтинг продавца
              </div>
            </div>
          )}
        </div>

        {/* Enhanced communication rating */}
        {getCommunicationRating()}
        
        {/* Store info with enhanced styling */}
        {storeInfo && (
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200">
            <Store className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-green-900">
                Магазин: {storeInfo.name}
              </div>
              <div className="text-xs text-green-700">
                Официальный представитель
              </div>
            </div>
          </div>
        )}
        
        <SellerDescription description={sellerProfile?.description_user} />
      </div>
      
      <SellerContactSection 
        user={user}
        onShowContactInfo={handleShowContactInfo}
      >
        {children}
      </SellerContactSection>

      <SellerHelpSection />

      <AuthDialog 
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onGoToLogin={handleGoToLogin}
      />
    </div>
  );
};

export default EnhancedSellerInfo;