import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Truck, Package, User, DollarSign, MessageSquare, MapPin, Phone } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface AdminOrderConfirmationDialogProps {
  orderId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose: () => void;
}

const AdminOrderConfirmationDialog: React.FC<AdminOrderConfirmationDialogProps> = ({
  orderId,
  open,
  setOpen,
  onClose,
}) => {
  const { data: order, isLoading, isError } = useQuery(
    ["order", orderId],
    async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          profiles (
            full_name,
            email,
            phone,
            opt_id,
            location,
            telegram
          )
        `
        )
        .eq("id", orderId)
        .single();

      if (error) {
        console.error("Error fetching order:", error);
        throw new Error("Failed to fetch order");
      }

      return data;
    },
    {
      enabled: open,
    }
  );

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Загрузка заказа...</DialogTitle>
            <DialogDescription>Пожалуйста, подождите.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (isError || !order) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ошибка</DialogTitle>
            <DialogDescription>Не удалось загрузить информацию о заказе.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Подтверждение заказа</DialogTitle>
          <DialogDescription>
            Проверьте детали заказа перед подтверждением.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[80vh] w-full">
          <div className="flex flex-col space-y-4">
            <Card>
              <CardContent className="grid gap-4">
                <div className="flex items-center space-x-4">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    Дата создания:{" "}
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <Truck className="h-4 w-4 text-gray-500" />
                  <span>Способ доставки: {order.deliveryMethod}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <Package className="h-4 w-4 text-gray-500" />
                  <span>Количество мест: {order.place_number}</span>
                </div>
                {order.profiles && (
                  <div className="flex items-center space-x-4">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Продавец: {order.profiles.full_name}</span>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span>Сумма заказа: {order.total_sum}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span>Дополнительная информация: {order.text_order}</span>
                </div>
                {order.profiles && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="text-sm font-bold">Информация о продавце:</div>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{order.profiles.full_name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{order.profiles.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{order.profiles.phone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-500" />
                        <span>{order.profiles.telegram}</span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {order.images && order.images.length > 0 && (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {order.images.map((image, index) => (
                      <div key={index} className="aspect-w-1 aspect-h-1">
                        <OptimizedImage
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="object-cover rounded-md"
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {order.videos && order.videos.length > 0 && (
              <Card>
                <CardContent>
                  <div className="grid grid-cols-1 gap-4">
                    {order.videos.map((video, index) => (
                      <video key={index} src={video} controls className="rounded-md" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="secondary" onClick={onClose}>
            Отменить
          </Button>
          <Button onClick={() => alert("Order confirmed!")}>
            Подтвердить заказ
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminOrderConfirmationDialog;
