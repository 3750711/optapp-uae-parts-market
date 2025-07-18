import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Clock,
  Package,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  MessageSquare,
  DollarSign
} from "lucide-react";
import { useSellerPriceOffers, useUpdatePriceOffer } from "@/hooks/use-price-offers";
import { PriceOffer } from "@/types/price-offer";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SellerPriceOffers = () => {
  const [responseModal, setResponseModal] = useState<{
    isOpen: boolean;
    offer?: PriceOffer;
    action?: "accept" | "reject";
  }>({ isOpen: false });
  const [sellerResponse, setSellerResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { profile } = useAuth();
  const { data: offers, isLoading } = useSellerPriceOffers();
  const updateOffer = useUpdatePriceOffer();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Новое предложение</Badge>;
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

  const handleOfferAction = (offer: PriceOffer, action: "accept" | "reject") => {
    setResponseModal({ isOpen: true, offer, action });
    setSellerResponse("");
  };

  const handleSubmitResponse = async () => {
    if (!responseModal.offer || !responseModal.action) return;

    setIsSubmitting(true);
    try {
      const { offer, action } = responseModal;

      if (action === "accept") {
        // Create order when accepting offer
        const { data: orderData, error: orderError } = await supabase.rpc(
          "create_user_order",
          {
            p_title: offer.product?.title || "Заказ из предложения цены",
            p_price: offer.offered_price,
            p_place_number: 1,
            p_seller_id: offer.seller_id,
            p_order_seller_name: offer.seller_profile?.full_name || "",
            p_seller_opt_id: offer.seller_profile?.opt_id || "",
            p_buyer_id: offer.buyer_id,
            p_brand: offer.product?.brand || "",
            p_model: offer.product?.model || "",
            p_status: "created",
            p_order_created_type: "price_offer_order",
            p_telegram_url_order: "",
            p_images: [],
            p_product_id: offer.product_id,
            p_delivery_method: "self_pickup",
            p_text_order: sellerResponse || "Заказ создан из принятого предложения цены",
            p_delivery_price_confirm: 0,
          }
        );

        if (orderError) throw orderError;

        // Update offer with order ID
        await updateOffer.mutateAsync({
          id: offer.id,
          data: {
            status: "accepted",
            seller_response: sellerResponse || undefined,
          },
        });

        // Update the offer with order_id
        await supabase
          .from("price_offers")
          .update({ order_id: orderData })
          .eq("id", offer.id);

        toast({
          title: "Предложение принято",
          description: "Заказ создан и отправлен покупателю.",
        });
      } else {
        // Just reject the offer
        await updateOffer.mutateAsync({
          id: offer.id,
          data: {
            status: "rejected",
            seller_response: sellerResponse || undefined,
          },
        });

        toast({
          title: "Предложение отклонено",
          description: "Покупатель будет уведомлен об отклонении.",
        });
      }

      setResponseModal({ isOpen: false });
    } catch (error) {
      console.error("Error processing offer:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обработать предложение. Попробуйте еще раз.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile || profile.user_type !== "seller") {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Доступ ограничен</h3>
            <p className="text-muted-foreground">
              Эта страница доступна только продавцам.
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

  const pendingOffers = offers?.filter(offer => offer.status === "pending") || [];
  const otherOffers = offers?.filter(offer => offer.status !== "pending") || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Предложения цены</h1>
        <p className="text-muted-foreground">
          Управляйте предложениями цены по вашим товарам
        </p>
      </div>

      {!offers || offers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Нет предложений</h3>
            <p className="text-muted-foreground">
              Пока никто не делал предложений цены по вашим товарам.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Pending offers */}
          {pendingOffers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                Требуют ответа ({pendingOffers.length})
              </h2>
              <div className="grid gap-4">
                {pendingOffers.map((offer) => (
                  <Card key={offer.id} className="border-yellow-200 bg-yellow-50/30">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {offer.product?.title || "Товар удален"}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {getTimeRemaining(offer.expires_at)}
                          </div>
                        </div>
                        {getStatusBadge(offer.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        {offer.product?.product_images?.[0] && (
                          <img
                            src={offer.product.product_images[0].url}
                            alt={offer.product.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{offer.product?.brand} {offer.product?.model}</p>
                          <p className="text-sm text-muted-foreground">
                            Покупатель: {offer.buyer_profile?.full_name} ({offer.buyer_profile?.opt_id})
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 py-4 border-t border-b">
                        <div>
                          <p className="text-sm text-muted-foreground">Ваша цена</p>
                          <p className="font-semibold">${offer.original_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Предложение</p>
                          <p className="font-semibold text-primary">${offer.offered_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Разница</p>
                          <p className="font-semibold text-red-600">
                            -${(offer.original_price - offer.offered_price).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {offer.message && (
                        <div>
                          <p className="text-sm font-medium mb-1">Сообщение покупателя:</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {offer.message}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3 pt-2">
                        <Button
                          onClick={() => handleOfferAction(offer, "accept")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="h-4 w-4 mr-2" />
                          Принять
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleOfferAction(offer, "reject")}
                          className="border-red-200 text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Отклонить
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Other offers */}
          {otherOffers.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">
                История предложений ({otherOffers.length})
              </h2>
              <div className="grid gap-4">
                {otherOffers.map((offer) => (
                  <Card key={offer.id} className="opacity-80">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">
                            {offer.product?.title || "Товар удален"}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDistanceToNow(new Date(offer.updated_at), { addSuffix: true, locale: ru })}
                          </div>
                        </div>
                        {getStatusBadge(offer.status)}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Ваша цена</p>
                          <p className="font-semibold">${offer.original_price.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Предложение</p>
                          <p className="font-semibold">${offer.offered_price.toLocaleString()}</p>
                        </div>
                      </div>

                      {offer.seller_response && (
                        <div>
                          <p className="text-sm font-medium mb-1">Ваш ответ:</p>
                          <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                            {offer.seller_response}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Response Modal */}
      <Dialog 
        open={responseModal.isOpen} 
        onOpenChange={(open) => !open && setResponseModal({ isOpen: false })}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {responseModal.action === "accept" ? "Принять предложение" : "Отклонить предложение"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {responseModal.offer && (
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-medium">{responseModal.offer.product?.title}</p>
                <div className="flex justify-between text-sm mt-2">
                  <span>Ваша цена: ${responseModal.offer.original_price.toLocaleString()}</span>
                  <span>Предложение: ${responseModal.offer.offered_price.toLocaleString()}</span>
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="response">
                {responseModal.action === "accept" 
                  ? "Сообщение покупателю (необязательно)"
                  : "Причина отклонения (необязательно)"
                }
              </Label>
              <Textarea
                id="response"
                value={sellerResponse}
                onChange={(e) => setSellerResponse(e.target.value)}
                placeholder={
                  responseModal.action === "accept"
                    ? "Спасибо за предложение! Создаю заказ..."
                    : "К сожалению, не могу принять такую цену..."
                }
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResponseModal({ isOpen: false })}
                disabled={isSubmitting}
                className="flex-1"
              >
                Отменить
              </Button>
              <Button
                onClick={handleSubmitResponse}
                disabled={isSubmitting}
                className="flex-1"
                variant={responseModal.action === "accept" ? "default" : "destructive"}
              >
                {isSubmitting ? "Обработка..." : 
                 responseModal.action === "accept" ? "Принять и создать заказ" : "Отклонить"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerPriceOffers;
