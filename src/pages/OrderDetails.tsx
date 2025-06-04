
import React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import OptimizedOrderImages from "@/components/order/OptimizedOrderImages";

const OrderDetails = () => {
  const { id } = useParams();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <div>Загрузка...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-8">
          <div>Ошибка загрузки заказа</div>
        </div>
      </Layout>
    );
  }

  if (!order) {
    return (
      <Layout>
        <div className="container py-8">
          <div>Заказ не найден</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Заказ #{order.order_number}</h1>
          <Badge variant="outline">{order.status}</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Детали заказа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="font-medium">Название:</span> {order.title}
            </div>
            <div>
              <span className="font-medium">Цена:</span> ${order.price}
            </div>
            <div>
              <span className="font-medium">Количество мест:</span> {order.place_number}
            </div>
            {order.brand && (
              <div>
                <span className="font-medium">Бренд:</span> {order.brand}
              </div>
            )}
            {order.model && (
              <div>
                <span className="font-medium">Модель:</span> {order.model}
              </div>
            )}
            <div>
              <span className="font-medium">Способ доставки:</span> {order.delivery_method}
            </div>
            {order.text_order && (
              <div>
                <span className="font-medium">Описание:</span> {order.text_order}
              </div>
            )}
          </CardContent>
        </Card>

        {order.images && order.images.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Изображения заказа</CardTitle>
            </CardHeader>
            <CardContent>
              <OptimizedOrderImages images={order.images} />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default OrderDetails;
