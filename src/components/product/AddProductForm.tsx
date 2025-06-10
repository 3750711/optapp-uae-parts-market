import React from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";

// Product form schema with zod validation
export const productSchema = z.object({
  title: z.string().min(3, {
    message: "Название должно содержать не менее 3 символов",
  }),
  price: z.string().min(1, {
    message: "Укажите цену товара",
  }).refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Цена должна быть положительным числом",
  }),
  brandId: z.string().min(1, {
    message: "Выберите марку автомобиля",
  }),
  modelId: z.string().optional(), // Model is optional
  placeNumber: z.string().min(1, {
    message: "Укажите количество мест",
  }).refine((val) => !isNaN(Number(val)) && Number.isInteger(Number(val)) && Number(val) > 0, {
    message: "Количество мест должно быть целым положительным числом",
  }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Стоимость доставки должна быть числом",
  }),
  sellerId: z.string().optional(), // Add sellerId for admin use
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface AddProductFormProps {
  form: UseFormReturn<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  imageUrls: string[];
  videoUrls: string[];
  userId?: string;
  brands: Array<{id: string, name: string}>;
  brandModels: Array<{id: string, name: string, brand_id: string}>;
  isLoadingCarData: boolean;
  watchBrandId: string;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: Array<{id: string, name: string}>;
  filteredModels: Array<{id: string, name: string, brand_id: string}>;
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  primaryImage?: string;
  setPrimaryImage?: (url: string) => void;
  // Admin-specific props
  sellers?: Array<{id: string, full_name: string}>;
  showSellerSelection?: boolean;
}

const AddProductForm: React.FC<AddProductFormProps> = ({
  form,
  onSubmit,
  isSubmitting,
  imageUrls,
  videoUrls,
  userId,
  brands,
  brandModels,
  isLoadingCarData,
  watchBrandId,
  searchBrandTerm,
  setSearchBrandTerm,
  searchModelTerm,
  setSearchModelTerm,
  filteredBrands,
  filteredModels,
  handleMobileOptimizedImageUpload,
  setVideoUrls,
  primaryImage,
  setPrimaryImage,
  sellers = [],
  showSellerSelection = false
}) => {
  const handleVideoUpload = (urls: string[]) => {
    setVideoUrls(prevUrls => [...prevUrls, ...urls]);
  };

  const handleVideoDelete = (urlToDelete: string) => {
    setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Seller Selection - only for admin */}
        {showSellerSelection && (
          <FormField
            control={form.control}
            name="sellerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Продавец</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите продавца" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Название товара</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Например: Передний бампер BMW X5 F15"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цена ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deliveryPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Стоимость доставки ($)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      step="0.01"
                      inputMode="decimal"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="font-medium">Информация об автомобиле</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="brandId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Марка автомобиля</FormLabel>
                  <div className="relative">
                    <Input 
                      type="text" 
                      placeholder="Поиск бренда..."
                      value={searchBrandTerm}
                      onChange={(e) => setSearchBrandTerm(e.target.value)}
                      className="mb-1"
                    />
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <FormControl>
                    <Select
                      disabled={isLoadingCarData}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger id="brand">
                        <SelectValue placeholder="Выберите марку" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredBrands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="modelId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Модель (необязательно)</FormLabel>
                  <div className="relative">
                    <Input 
                      type="text" 
                      placeholder="Поиск модели..."
                      value={searchModelTerm}
                      onChange={(e) => setSearchModelTerm(e.target.value)}
                      className="mb-1"
                    />
                    <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  </div>
                  <FormControl>
                    <Select
                      disabled={!watchBrandId || isLoadingCarData}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите модель" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredModels.map((model) => (
                          <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="placeNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Количество мест для отправки</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  min="1"
                  placeholder="Количество мест"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание товара (необязательно)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Описание товара"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <Label htmlFor="images">Фотографии товара</Label>
          <MobileOptimizedImageUpload
            onUploadComplete={handleMobileOptimizedImageUpload}
            maxImages={30}
            existingImages={imageUrls}
            primaryImage={primaryImage}
            onSetPrimaryImage={setPrimaryImage}
            productId={userId}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="videos">Видео товара (необязательно)</Label>
          <CloudinaryVideoUpload
            videos={videoUrls}
            onUpload={handleVideoUpload}
            onDelete={handleVideoDelete}
            maxVideos={2}
            productId={userId}
            buttonText="Загрузить видео товара"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Публикация...
            </>
          ) : (
            'Опубликовать'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default AddProductForm;
