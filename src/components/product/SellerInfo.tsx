
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { SellerProfile } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { toast } from "@/hooks/use-toast";
import { SellerBasicInfo } from "./seller/SellerBasicInfo";
import { SellerCommunicationRating } from "./seller/SellerCommunicationRating";
import { SellerStoreSection } from "./seller/SellerStoreSection";
import { SellerDescription } from "./seller/SellerDescription";
import { SellerRating } from "./seller/SellerRating";
import { SellerContactSection } from "./seller/SellerContactSection";
import { SellerHelpSection } from "./seller/SellerHelpSection";
import { AuthDialog } from "./seller/AuthDialog";

interface SellerInfoProps {
  sellerProfile?: SellerProfile | null;
  seller_name: string;
  seller_id: string;
  children?: React.ReactNode;
}

const SellerInfo: React.FC<SellerInfoProps> = ({
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

  return (
    <div className="border rounded-lg p-4 mb-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <User className="h-5 w-5 mr-2 text-primary" />
        Информация о продавце
      </h3>
      
      <div className="flex flex-col space-y-3">
        <SellerBasicInfo 
          sellerProfile={sellerProfile}
          seller_name={seller_name}
          seller_id={seller_id}
          user={user}
          copied={copied}
          onCopyOptId={copyToClipboard}
          onShowContactInfo={handleShowContactInfo}
        />

        <SellerCommunicationRating 
          communication_ability={sellerProfile?.communication_ability}
        />
        
        <SellerStoreSection storeInfo={storeInfo} />
        
        <SellerDescription description={sellerProfile?.description_user} />

        <SellerRating rating={sellerProfile?.rating} />
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

export default SellerInfo;
