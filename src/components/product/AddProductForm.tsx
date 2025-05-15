
import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RealtimeImageUpload } from "@/components/ui/real-time-image-upload";
import VideoUpload from "@/components/ui/video-upload";
import { BrandModelSelector } from "./BrandModelSelector";

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
  deliveryPrice: z.string().optional().refine((val) => val === '' || !isNaN(Number(val)), {
    message: "Стоимость доставки должна быть числом",
  }),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface AddProductFormProps {
  form: ReturnType<typeof useForm<ProductFormValues>>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  isSubmitting: boolean;
  imageUrls: string[];
  videoUrls: string[];
  userId?: string;
  brands: Array<{ id: string; name: string }>;
  brandModels: Array<{ id: string; name: string }>;
  isLoadingCarData: boolean;
  watchBrandId: string;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  filteredBrands: Array<{ id: string; name: string }>;
  filteredModels: Array<{ id: string; name: string }>;
  handleRealtimeImageUpload: (urls: string[]) => void;
  setVideoUrls: (urls: string[]) => void;
}

const AddProductForm: React.FC<AddProductFormProps> = ({
  form,
  onSubmit,
  isSubmitting,
  imageUrls,
  videoUrls,
  userId,
  handleRealtimeImageUpload,
  setVideoUrls
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
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
                      className="h-10"
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
                        className="h-10"
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
                        className="h-10"
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
            
            {/* New Brand/Model Selector */}
            <div>
              <Label>Марка и модель автомобиля</Label>
              <div className="mt-1.5">
                <FormField
                  control={form.control}
                  name="brandId"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <BrandModelSelector
                        selectedBrandId={field.value}
                        selectedModelId={form.getValues("modelId")}
                        onBrandChange={(brandId) => {
                          field.onChange(brandId);
                          // Clear model if brand changes
                          if (brandId !== field.value) {
                            form.setValue("modelId", undefined);
                          }
                        }}
                        onModelChange={(modelId) => {
                          form.setValue("modelId", modelId);
                        }}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="modelId"
                render={() => <></>} // Hidden field, managed by the BrandModelSelector
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
                    className="h-10"
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
            <Label>Фотографии товара</Label>
            <RealtimeImageUpload
              onUploadComplete={handleRealtimeImageUpload}
              maxImages={25}
              storageBucket="Product Images"
              storagePath={`products/${userId || 'unknown'}`}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Видео товара (опционально)</Label>
            <VideoUpload
              videos={videoUrls}
              onUpload={setVideoUrls}
              onDelete={(url) => setVideoUrls(videoUrls.filter((v) => v !== url))}
              maxVideos={3}
              storageBucket="Product Images"
              storagePrefix={`products-video/${userId || 'unknown'}/`}
            />
          </div>
        </div>
        
        <div className="mt-6">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 h-12 text-base"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Разместить товар"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddProductForm;
