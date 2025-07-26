
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Check } from 'lucide-react';

interface OrderConfirmImagesDialogProps {
  orderId: string;
}

export const OrderConfirmImagesDialog = ({ orderId }: OrderConfirmImagesDialogProps) => {
  const { data: images } = useQuery({
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div className="flex items-center gap-2 text-green-600 text-sm cursor-pointer hover:text-green-700">
          <Check className="h-4 w-4" />
          <span>Confirmation photos received</span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Confirmation Photos</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {images?.map((url, index) => (
            <div key={index} className="relative aspect-square">
              <img
                src={url}
                alt={`Confirmation image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
