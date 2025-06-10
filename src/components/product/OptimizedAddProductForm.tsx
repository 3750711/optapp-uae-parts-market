
import React from 'react';
import { z } from 'zod';
import { UseFormReturn } from 'react-hook-form';
import { CarBrand, CarModel } from '@/hooks/useCarBrandsAndModels';

// Base schema for regular product form
export const createProductSchema = z.object({
  title: z.string().min(1, 'Название обязательно'),
  price: z.number().min(0, 'Цена должна быть положительной'),
  description: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  place_number: z.number().optional(),
  delivery_price: z.number().optional(),
});

// Extended schema for admin forms that includes seller selection
export const adminProductSchema = createProductSchema.extend({
  sellerId: z.string().min(1, 'Выберите продавца'),
});

export type ProductFormValues = z.infer<typeof createProductSchema>;
export type AdminProductFormValues = z.infer<typeof adminProductSchema>;

interface OptimizedAddProductFormProps {
  form: UseFormReturn<ProductFormValues> | UseFormReturn<AdminProductFormValues>;
  onSubmit: (values: ProductFormValues | AdminProductFormValues) => Promise<void>;
  isSubmitting: boolean;
  imageUrls: string[];
  videoUrls: string[];
  brands: CarBrand[];
  brandModels: CarModel[];
  isLoadingCarData: boolean;
  watchBrandId: string;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  primaryImage: string;
  setPrimaryImage: (url: string) => void;
  onImageDelete: (url: string) => void;
  sellers?: { id: string; full_name: string }[];
  showSellerSelection: boolean;
}

const OptimizedAddProductForm: React.FC<OptimizedAddProductFormProps> = ({
  form,
  onSubmit,
  isSubmitting,
  imageUrls,
  videoUrls,
  brands,
  brandModels,
  isLoadingCarData,
  watchBrandId,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  handleMobileOptimizedImageUpload,
  setVideoUrls,
  primaryImage,
  setPrimaryImage,
  onImageDelete,
  sellers,
  showSellerSelection
}) => {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = form.getValues();
    await onSubmit(values);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Добавить товар</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seller Selection - Only for admin */}
          {showSellerSelection && sellers && (
            <div>
              <label className="block text-sm font-medium mb-2">Продавец *</label>
              <select
                {...form.register('sellerId' as any)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Выберите продавца...</option>
                {sellers.map(seller => (
                  <option key={seller.id} value={seller.id}>
                    {seller.full_name}
                  </option>
                ))}
              </select>
              {showSellerSelection && form.formState.errors && 'sellerId' in form.formState.errors && (
                <p className="text-red-500 text-sm mt-1">
                  {(form.formState.errors as any).sellerId?.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Название товара</label>
            <input
              type="text"
              {...form.register('title')}
              className="w-full p-2 border rounded-md"
              placeholder="Введите название товара"
            />
            {form.formState.errors.title && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Цена</label>
            <input
              type="number"
              {...form.register('price', { valueAsNumber: true })}
              className="w-full p-2 border rounded-md"
              placeholder="Введите цену"
            />
            {form.formState.errors.price && (
              <p className="text-red-500 text-sm mt-1">{form.formState.errors.price.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Количество мест</label>
            <input
              type="number"
              {...form.register('place_number', { valueAsNumber: true })}
              className="w-full p-2 border rounded-md"
              placeholder="Количество мест"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Стоимость доставки</label>
            <input
              type="number"
              {...form.register('delivery_price', { valueAsNumber: true })}
              className="w-full p-2 border rounded-md"
              placeholder="Стоимость доставки"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Описание</label>
          <textarea
            {...form.register('description')}
            className="w-full p-2 border rounded-md"
            rows={4}
            placeholder="Описание товара"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Сохранение...' : 'Сохранить товар'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OptimizedAddProductForm;
