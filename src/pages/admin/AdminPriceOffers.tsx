import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, DollarSign } from "lucide-react";
import { useAdminPriceOffers, useUpdatePriceOffer } from "@/hooks/use-price-offers";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";

const AdminPriceOffers = () => {
  const { data: offers, isLoading } = useAdminPriceOffers();
  const updateOffer = useUpdatePriceOffer();

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      accepted: "bg-green-100 text-green-800 border-green-200",
      rejected: "bg-red-100 text-red-800 border-red-200",
      expired: "secondary",
      cancelled: "outline"
    };
    return <Badge className={variants[status as keyof typeof variants] || "outline"}>{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Управление предложениями цены</h1>
        <p className="text-muted-foreground">Все предложения цены в системе</p>
      </div>

      {!offers || offers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <DollarSign className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Нет предложений</h3>
            <p className="text-muted-foreground">Пока нет предложений цены в системе.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {offers.map((offer) => (
            <Card key={offer.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{offer.product?.title}</CardTitle>
                  {getStatusBadge(offer.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Покупатель</p>
                    <p className="font-medium">{offer.buyer_profile?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Продавец</p>
                    <p className="font-medium">{offer.seller_profile?.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Цена → Предложение</p>
                    <p className="font-medium">${offer.original_price} → ${offer.offered_price}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Создано</p>
                    <p className="font-medium">{formatDistanceToNow(new Date(offer.created_at), { addSuffix: true, locale: ru })}</p>
                  </div>
                </div>
                
                {offer.status === "pending" && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateOffer.mutate({ id: offer.id, data: { status: "cancelled" } })}
                      variant="outline"
                    >
                      Отменить
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminPriceOffers;