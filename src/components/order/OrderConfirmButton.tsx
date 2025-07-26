import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Check } from "lucide-react";
import { OrderConfirmationImages } from "@/components/order/OrderConfirmationImages";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface OrderConfirmButtonProps {
  orderId: string;
}

export const OrderConfirmButton: React.FC<OrderConfirmButtonProps> = ({ orderId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: orderDetails } = useQuery({
    queryKey: ['order-details', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          order_number,
          buyer:profiles!orders_buyer_id_fkey (
            opt_id
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    }
  });

  const { data: images = [] } = useQuery({
    queryKey: ['confirm-images', orderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('confirm_images')
        .select('url')
        .eq('order_id', orderId);

      if (error) throw error;
      return data?.map(img => img.url) || [];
    }
  });

  const handleConfirm = () => {
    setIsOpen(false);
  };

  if (images.length > 0) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <Check className="h-4 w-4" />
        <span>Confirmation photos uploaded</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full text-green-600 hover:text-green-700 hover:bg-green-50 gap-2"
      >
        <Upload className="h-4 w-4" />
        Attach photo with signature
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload confirmation photos</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="font-medium text-yellow-800 mb-4">
                Write the order number and buyer ID on the sold item
              </p>
              {orderDetails && (
                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Order Number:</h3>
                    <p className="text-2xl font-extrabold text-primary">
                      {orderDetails.order_number || 'Not specified'}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-1">Buyer OPT_ID:</h3>
                    <p className="text-2xl font-extrabold text-secondary">
                      {orderDetails.buyer?.opt_id || 'Not specified'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <OrderConfirmationImages orderId={orderId} canEdit={true} />
          </div>

          <DialogFooter>
            <Button 
              onClick={handleConfirm}
              className="w-full sm:w-auto"
              variant="default"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
