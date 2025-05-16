
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, CircleDollarSign, Star, User, Store, Copy, CheckCheck } from "lucide-react";
import { SellerProfile } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SellerInfoProps {
  sellerProfile?: SellerProfile | null; // Make it optional and nullable
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
  const [storeInfo, setStoreInfo] = useState<{ id: string; name: string } | null>(null);
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
    navigate('/login');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Скопировано!",
        description: "OPT ID скопирован в буфер обмена",
      });
      
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="border rounded-lg p-4 mb-6 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-lg font-semibold mb-3 flex items-center">
        <User className="h-5 w-5 mr-2 text-primary" />
        Информация о продавце
      </h3>
      
      <div className="flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              to={`/seller/${seller_id}`}
              className="text-primary font-medium hover:underline transition-colors flex items-center"
            >
              {seller_name}
              <span className="text-xs ml-2 text-gray-500">(Открыть профиль)</span>
            </Link>
            {sellerProfile?.opt_status === 'opt_user' && (
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium">
                OPT
              </span>
            )}
          </div>
          
          {sellerProfile?.opt_id && user ? (
            <div className="text-sm flex items-center gap-2">
              <span className="text-gray-500">OPT ID: </span>
              <span className="font-medium">{sellerProfile.opt_id}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-gray-400 hover:text-primary"
                    onClick={() => copyToClipboard(sellerProfile.opt_id || '')}
                  >
                    {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Копировать OPT ID</p>
                </TooltipContent>
              </Tooltip>
            </div>
          ) : sellerProfile?.opt_id && (
            <div className="text-sm">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-primary"
                onClick={handleShowContactInfo}
              >
                Показать OPT ID
              </Button>
            </div>
          )}
        </div>
        
        {storeInfo && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200 flex justify-between items-center">
            <div className="flex items-center">
              <Store className="h-5 w-5 mr-2 text-primary" />
              <div>
                <div className="font-medium">{storeInfo.name}</div>
                <div className="text-sm text-gray-600">Магазин продавца</div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="whitespace-nowrap">
              <Link to={`/stores/${storeInfo.id}`}>
                Посмотреть магазин
              </Link>
            </Button>
          </div>
        )}
        
        {sellerProfile?.description_user && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{sellerProfile.description_user}</p>
          </div>
        )}

        {sellerProfile?.rating !== null && sellerProfile?.rating !== undefined && (
          <div className="flex items-center">
            <div className="flex mr-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.floor(sellerProfile.rating || 0)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm">
              <span className="font-medium">{sellerProfile.rating?.toFixed(1)}</span>
              <span className="text-gray-500"> / 5</span>
            </span>
          </div>
        )}
      </div>
      
      {user ? (
        <div className="grid grid-cols-1 gap-2 mt-4">
          {children}
        </div>
      ) : (
        <Alert className="mt-4 border-primary/20 bg-primary/5">
          <AlertTitle className="text-primary">Требуется авторизация</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>Для связи с продавцом необходимо авторизоваться</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleShowContactInfo}>
                Войти для связи с продавцом
              </Button>
              <Button variant="outline" onClick={() => navigate('/register')}>
                Регистрация
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 text-sm mt-4">
        <div className="flex items-center text-gray-700">
          <ShieldCheck className="h-5 w-5 mr-2 text-optapp-yellow" />
          <span>Безопасная сделка через платформу</span>
        </div>
        <div className="flex items-center text-gray-700">
          <CircleDollarSign className="h-5 w-5 mr-2 text-optapp-yellow" />
          <span>Гарантия возврата денег в течение 14 дней</span>
        </div>
      </div>

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Требуется авторизация</DialogTitle>
            <DialogDescription>
              Для связи с продавцом необходимо войти в аккаунт или зарегистрироваться.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center">
            <Button onClick={handleGoToLogin} className="w-full sm:w-auto">
              Войти / Зарегистрироваться
            </Button>
            <Button variant="outline" onClick={() => setShowAuthDialog(false)} className="w-full sm:w-auto">
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerInfo;
