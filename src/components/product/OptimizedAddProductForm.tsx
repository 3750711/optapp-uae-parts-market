
import React from 'react';
import { z } from 'zod';

// Экспортируем схему и типы
export const createProductSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  price: z.number().min(0, 'Цена должна быть положительной'),
  description: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  place_number: z.number().optional(),
  delivery_price: z.number().optional(),
});

export type ProductFormValues = z.infer<typeof createProductSchema>;

interface OptimizedAddProductFormProps {
  onSuccess: (data: any) => void;
  initialProductData?: Partial<ProductFormValues>;
  isMobile?: boolean;
}

const OptimizedAddProductForm: React.FC<OptimizedAddProductFormProps> = ({
  onSuccess,
  initialProductData,
  isMobile = false
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Добавить товар</h2>
      <p>Форма добавления товара будет реализована позже</p>
    </div>
  );
};

export default OptimizedAddProductForm;
