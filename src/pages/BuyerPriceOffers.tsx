
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Package, RefreshCw, AlertCircle } from "lucide-react";
import { useBuyerPriceOffers } from "@/hooks/use-price-offers";
import { PriceOffer } from "@/types/price-offer";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { NewMakeOfferModal } from "@/components/price-offer/NewMakeOfferModal";

const BuyerPriceOffers = () => {
  const [showReofferModal, setShowReofferModal] = useState<{
    isOpen: boolean;
    offer?: PriceOffer;
  }>({ isOpen: false });

  const { profile } = useAuth();
  const { data: offers, isLoading } = useBuyerPriceOffers();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Ожидает ответа</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Принято</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Отклонено</Badge>;
      case "expired":
        return <Badge variant="secondary">Истекло</Badge>;
      case "cancelled":
        return <Badge variant="outline">Отменено</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const expirationTime = new Date(expiresAt);
    const now = new Date();
    
    if (expirationTime <= now) {
      return "Истекло";
    }
    
    return `Истекает ${formatDistanceToNow(expirationTime, {
      addSuffix: true,
      locale: ru,
    })}`;
  };

  const handleMakeNewOffer = (offer: PriceOffer) => {
    console.log('🎯 BuyerPriceOffers: Opening reoffer modal for offer:', offer.id);
    setShowReofferModal({ isOpen: true, offer });
  };

  const handleModalClose = () => {
    console.log('🎯 BuyerPriceOffers: Closing reoffer modal');
    setShowReofferModal({ isOpen: false });
  };

  if (!profile || profile.user_type !== "buyer") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Доступ ограничен</h3>
            <p className="text-muted-foreground">
              Эта страница доступна только покупателям.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Мои предложения цены</h1>
        <p className="text-muted-foreground">
          Управляйте своими предложениями цены по товарам
        </p>
      </div>

      {!offers || offers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Нет предложений</h3>
            <p className="text-muted-foreground mb-4">
              Вы еще не делали предложений цены по товарам.
            </p>
            <Button onClick={() => window.location.href = "/catalog"}>
              Перейти в каталог
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {offers.map((offer) => (
            <Card key={offer.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {offer.product?.title || "Товар удален"}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {offer.status === "pending" 
                        ? getTimeRemaining(offer.expires_at)
                        : `Создано ${formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: ru })}`
                      }
                    </div>
                  </div>
                  {getStatusBadge(offer.status)}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {offer.product && (
                  <div className="flex items-center gap-4">
                    {offer.product.product_images?.[0] && (
                      <img
                        src={offer.product.product_images[0].url}
                        alt={offer.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{offer.product.brand} {offer.product.model}</p>
                      <p className="text-sm text-muted-foreground">
                        Продавец: {offer.seller_profile?.full_name}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 py-4 border-t border-b">
                  <div>
                    <p className="text-sm text-muted-foreground">Цена товара</p>
                    <p className="font-semibold">${offer.original_price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ваше предложение</p>
                    <p className="font-semibold text-primary">${offer.offered_price.toLocaleString()}</p>
                  </div>
                </div>

                {offer.message && (
                  <div>
                    <p className="text-sm font-medium mb-1">Ваше сообщение:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {offer.message}
                    </p>
                  </div>
                )}

                {offer.seller_response && (
                  <div>
                    <p className="text-sm font-medium mb-1">Ответ продавца:</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                      {offer.seller_response}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  {offer.status === "rejected" && offer.product?.status === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMakeNewOffer(offer)}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Предложить новую цену
                    </Button>
                  )}

                  {offer.status === "accepted" && offer.order_id && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => window.location.href = `/buyer-orders`}
                    >
                      Посмотреть заказ
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showReofferModal.offer && showReofferModal.offer.product && (
        <NewMakeOfferModal
          isOpen={showReofferModal.isOpen}
          onClose={handleModalClose}
          product={{
            id: showReofferModal.offer.product_id,
            title: showReofferModal.offer.product.title,
            price: showReofferModal.offer.original_price,
            brand: showReofferModal.offer.product.brand,
            model: showReofferModal.offer.product.model || "",
            condition: "Б/у",
            seller_id: showReofferModal.offer.seller_id,
            seller_name: showReofferModal.offer.product.seller_name,
            status: showReofferModal.offer.product.status as any,
            created_at: "",
            updated_at: "",
            lot_number: 0,
            product_images: showReofferModal.offer.product.product_images,
            profiles: showReofferModal.offer.seller_profile ? {
              id: showReofferModal.offer.seller_profile.id,
              full_name: showReofferModal.offer.seller_profile.full_name,
              avatar_url: null,
              rating: null,
              opt_id: showReofferModal.offer.seller_profile.opt_id,
              opt_status: 'free_user',
              description_user: null,
              telegram: showReofferModal.offer.seller_profile.telegram || null,
              phone: null,
              location: null,
              communication_ability: null,
            } : undefined,
          } as any}
          existingOffer={{
            id: showReofferModal.offer.id,
            product_id: showReofferModal.offer.product_id,
            buyer_id: showReofferModal.offer.buyer_id,
            seller_id: showReofferModal.offer.seller_id,
            original_price: showReofferModal.offer.original_price,
            offered_price: showReofferModal.offer.offered_price,
            status: showReofferModal.offer.status as any,
            created_at: showReofferModal.offer.created_at,
            updated_at: showReofferModal.offer.updated_at,
            expires_at: showReofferModal.offer.expires_at,
            message: showReofferModal.offer.message,
            seller_response: showReofferModal.offer.seller_response,
            order_id: showReofferModal.offer.order_id
          }}
        />
      )}
    </div>
  );
};

export default BuyerPriceOffers;
