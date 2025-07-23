import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
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
  DollarSign,
  ChevronLeft,
  User,
  Phone,
  Star,
  ShoppingCart
} from "lucide-react";
import { useSellerPriceOffers, useUpdatePriceOffer } from "@/hooks/use-price-offers";
import { PriceOffer } from "@/types/price-offer";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPrice } from "@/utils/formatPrice";

const SellerPriceOffers = () => {
  const navigate = useNavigate();
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

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

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

  const isOfferExpired = (expiresAt: string) => {
    return new Date(expiresAt) <= new Date();
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

      console.log(`Processing offer ${action} for offer ID: ${offer.id}`);

      // Simply update the offer status - the trigger will handle order creation
      await updateOffer.mutateAsync({
        offerId: offer.id,
        data: {
          status: action === "accept" ? "accepted" : "rejected",
          seller_response: sellerResponse || undefined,
        },
      });

      if (action === "accept") {
        toast({
          title: "Предложение принято!",
          description: "Заказ будет создан автоматически. Обновите страницу через несколько секунд, чтобы увидеть ссылку на заказ.",
        });
      } else {
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

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </Layout>
    );
  }

  const pendingOffers = offers?.filter(offer => offer.status === "pending" && !isOfferExpired(offer.expires_at)) || [];
  const otherOffers = offers?.filter(offer => offer.status !== "pending" || isOfferExpired(offer.expires_at)) || [];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Назад
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Предложения цены</h1>
            <p className="text-muted-foreground">
              Управляйте предложениями цены по вашим товарам
            </p>
          </div>
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
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2">
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
                        {/* Product Information */}
                        <div className="flex flex-col md:flex-row gap-4">
                          {offer.product?.product_images?.[0] && (
                            <img
                              src={offer.product.product_images[0].url}
                              alt={offer.product.title}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <div>
                              <h4 className="font-medium">{offer.product?.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {offer.product?.brand} {offer.product?.model}
                              </p>
                            </div>
                            {offer.product?.description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {offer.product.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Price Comparison */}
                        <div className="bg-white rounded-lg p-4 border">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground mb-1">Ваша цена</div>
                                <div className="text-lg font-semibold line-through text-gray-500">
                                  {formatPrice(offer.original_price)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-muted-foreground mb-1">Предложение</div>
                                <div className="text-2xl font-bold text-green-600">
                                  {formatPrice(offer.offered_price)}
                                </div>
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground mb-1">Разница</div>
                              <div className="text-lg font-semibold text-red-600">
                                -{formatPrice(offer.original_price - offer.offered_price)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Buyer Information */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h5 className="font-medium mb-2 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Информация о покупателе
                          </h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center justify-between">
                              <span>Имя:</span>
                              <span className="font-medium">{offer.buyer_profile?.full_name || 'Не указано'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>OPT ID:</span>
                              <span className="font-medium">{offer.buyer_profile?.opt_id || 'Не указано'}</span>
                            </div>
                            {offer.buyer_profile?.telegram && (
                              <div className="flex items-center justify-between">
                                <span>Telegram:</span>
                                <span className="font-medium">@{offer.buyer_profile.telegram}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {offer.message && (
                          <div className="bg-gray-50 rounded-lg p-4 border">
                            <p className="text-sm font-medium mb-2">Сообщение покупателя:</p>
                            <p className="text-sm text-muted-foreground">
                              {offer.message}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-col md:flex-row gap-3 pt-2">
                          <Button
                            onClick={() => handleOfferAction(offer, "accept")}
                            className="bg-green-600 hover:bg-green-700 flex-1"
                            disabled={isOfferExpired(offer.expires_at)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Принять предложение
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleOfferAction(offer, "reject")}
                            className="border-red-200 text-red-700 hover:bg-red-50 flex-1"
                            disabled={isOfferExpired(offer.expires_at)}
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
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                          <div className="space-y-2">
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
                        <div className="flex flex-col md:flex-row gap-4">
                          {offer.product?.product_images?.[0] && (
                            <img
                              src={offer.product.product_images[0].url}
                              alt={offer.product.title}
                              className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-medium">{offer.product?.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {offer.product?.brand} {offer.product?.model}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Ваша цена</p>
                            <p className="font-semibold">{formatPrice(offer.original_price)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Предложение</p>
                            <p className="font-semibold">{formatPrice(offer.offered_price)}</p>
                          </div>
                        </div>

                        {offer.seller_response && (
                          <div className="bg-gray-50 rounded-lg p-3 border">
                            <p className="text-sm font-medium mb-1">Ваш ответ:</p>
                            <p className="text-sm text-muted-foreground">
                              {offer.seller_response}
                            </p>
                          </div>
                        )}

                        {offer.status === 'accepted' && offer.order_id && (
                          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                            <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                              <ShoppingCart className="h-4 w-4" />
                              Заказ создан
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/seller/order-details/${offer.order_id}`)}
                              className="mt-2"
                            >
                              Перейти к заказу
                            </Button>
                          </div>
                        )}

                        {offer.status === 'accepted' && !offer.order_id && (
                          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <p className="text-sm font-medium text-blue-800 mb-1 flex items-center gap-2">
                              <RefreshCw className="h-4 w-4 animate-spin" />
                              Создание заказа...
                            </p>
                            <p className="text-xs text-blue-700">
                              Заказ создается автоматически. Обновите страницу через несколько секунд.
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
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <div className="flex gap-3">
                    {responseModal.offer.product?.product_images?.[0] && (
                      <img
                        src={responseModal.offer.product.product_images[0].url}
                        alt={responseModal.offer.product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <p className="font-medium">{responseModal.offer.product?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {responseModal.offer.product?.brand} {responseModal.offer.product?.model}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <div>
                      <div className="text-sm text-muted-foreground">Ваша цена</div>
                      <div className="font-semibold line-through text-gray-500">
                        {formatPrice(responseModal.offer.original_price)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Предложение</div>
                      <div className="text-lg font-bold text-green-600">
                        {formatPrice(responseModal.offer.offered_price)}
                      </div>
                    </div>
                  </div>

                  {responseModal.action === "accept" && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4" />
                        Заказ будет создан автоматически
                      </p>
                      <p className="text-xs text-green-700">
                        После принятия предложения заказ создастся автоматически
                      </p>
                    </div>
                  )}
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
                      ? "Спасибо за предложение! Принимаю вашу цену."
                      : "К сожалению, не могу принять такую цену..."
                  }
                  rows={3}
                />
              </div>

              <div className="flex flex-col md:flex-row gap-3 pt-2">
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
                   responseModal.action === "accept" ? "Принять предложение" : "Отклонить"
                  }
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default SellerPriceOffers;
