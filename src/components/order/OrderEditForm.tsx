
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

interface OrderEditFormProps {
  order: {
    id?: string;
    title: string;
    brand: string;
    model: string;
    price: number;
  };
  onSave: (updatedOrder: any) => void;
  onCancel: () => void;
}

export const OrderEditForm: React.FC<OrderEditFormProps> = ({
  order,
  onSave,
  onCancel,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: order.title,
    brand: order.brand,
    model: order.model,
    price: order.price,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!order.id) {
      toast({
        title: "Ошибка",
        description: "ID заказа не найден",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          title: formData.title,
          brand: formData.brand,
          model: formData.model,
          price: parseFloat(formData.price.toString()),
        })
        .eq('id', order.id)
        .eq('status', 'created')
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Успешно",
        description: "Заказ обновлен",
      });

      onSave(data);
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить заказ",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Наименование *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="brand">Бренд</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Модель</Label>
          <Input
            id="model"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Цена (AED) *</Label>
        <Input
          id="price"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
          required
          min="0"
          step="0.01"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Сохранение...
            </>
          ) : (
            'Сохранить'
          )}
        </Button>
      </div>
    </form>
  );
};
