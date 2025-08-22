import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import SellerLayout from "@/components/layout/SellerLayout";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerOrderDetailsTranslations } from '@/utils/translations/sellerOrderDetails';
import { getCommonTranslations } from '@/utils/translations/common';

const SellerOrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { language } = useLanguage();
  const t = getSellerOrderDetailsTranslations(language);
  const c = getCommonTranslations(language);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error(t.errorLoadingOrder);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, t.errorLoadingOrder]);

  if (loading) {
    return (
      <SellerLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">{t.loadingOrder}</div>
        </div>
      </SellerLayout>
    );
  }

  if (!order) {
    return (
      <SellerLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            {t.orderNotFound}
          </div>
        </div>
      </SellerLayout>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'confirmed': return 'default';
      case 'shipped': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <SellerLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/seller/orders")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {c.buttons.back}
          </Button>
          <h1 className="text-2xl font-bold">{t.orderDetails}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t.productInformation}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t.orderNumber}
                </label>
                <p className="font-mono">{order.id}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t.productName}
                </label>
                <p>{order.title || "Not specified"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t.quantity}
                  </label>
                  <p>{order.quantity || 1}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t.unitPrice}
                  </label>
                  <p>${order.price}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t.totalPrice}
                  </label>
                  <p className="font-semibold">${order.price}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {t.buyerInformation}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t.buyerName}
                </label>
                <p>{order.buyer_name || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t.buyerTelegram}
                </label>
                <p>{order.telegram || "Not specified"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  {t.buyerOptId}
                </label>
                <p>{order.buyer_opt_id || "Not specified"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{t.orderStatus}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={getStatusVariant(order.status)}>
                  {t.statuses[order.status] || order.status}
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t.createdAt}
                  </label>
                  <p>{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    {t.updatedAt}
                  </label>
                  <p>{new Date(order.updated_at || order.created_at).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SellerLayout>
  );
};

export default SellerOrderDetails;