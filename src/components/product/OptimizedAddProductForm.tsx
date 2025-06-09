
import React, { useCallback } from "react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { useOptimizedBrandSearch } from "@/hooks/useOptimizedBrandSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StickyMobileActions from "@/components/ui/StickyMobileActions";
import { MobileOptimizedImageUpload } from "@/components/ui/MobileOptimizedImageUpload";
import { CloudinaryVideoUpload } from "@/components/ui/cloudinary-video-upload";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EnhancedVirtualizedSelect from "@/components/ui/EnhancedVirtualizedSelect";

// Updated product form schema with conditional sellerId validation
export const createProductSchema = (showSellerSelection: boolean = false) => z.object({
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
  modelId: z.string().optional(),
  placeNumber: z.string().min(1, {
    message: "Укажите количество мест",
  }).refine((val) => !isNaN(Number(val)) && Number.isInteger(Number(val)) && Number(val) > 0, {
    message: "Количество мест должно быть целым положительным числом",
  }),
  description: z.string().optional(),
  deliveryPrice: z.string().optional().refine((val) => val === "" || !isNaN(Number(val)), {
    message: "Стоимость доставки должна быть числом",
  }),
  sellerId: showSellerSelection 
    ? z.string().min(1, { message: "Выберите продавца" })
    : z.string().optional(),
});

// Legacy schema for backward compatibility
export const productSchema = createProductSchema(true);

export type ProductFormValues = z.infer<typeof productSchema>;

interface OptimizedAddProductFormProps {
  form: UseFormReturn<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => void;
  isSubmitting: boolean;
  imageUrls: string[];
  videoUrls: string[];
  brands: Array<{id: string, name: string}>;
  brandModels: Array<{id: string, name: string, brand_id: string}>;
  isLoadingCarData: boolean;
  watchBrandId: string;
  searchBrandTerm: string;
  setSearchBrandTerm: (term: string) => void;
  searchModelTerm: string;
  setSearchModelTerm: (term: string) => void;
  handleMobileOptimizedImageUpload: (urls: string[]) => void;
  setVideoUrls: React.Dispatch<React.SetStateAction<string[]>>;
  primaryImage?: string;
  setPrimaryImage?: (url: string) => void;
  onImageDelete?: (url: string) => void;
  sellers?: Array<{id: string, full_name: string}>;
  showSellerSelection?: boolean;
}

const OptimizedAddProductForm = React.memo<OptimizedAddProductFormProps>(({
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
  sellers = [],
  showSellerSelection = false
}) => {
  const isMobile = useIsMobile();
  const { filteredBrands, filteredModels } = useOptimizedBrandSearch(
    brands,
    brandModels,
    searchBrandTerm,
    searchModelTerm,
    watchBrandId
  );

  const handleSubmit = useCallback((values: ProductFormValues) => {
    console.log('🚀 Form submission started:', {
      showSellerSelection,
      sellerId: values.sellerId,
      hasTitle: !!values.title,
      hasPrice: !!values.price,
      hasBrandId: !!values.brandId,
      imageCount: imageUrls.length
    });

    // If seller selection is hidden, we don't need sellerId for validation
    if (!showSellerSelection) {
      // Remove sellerId from validation by creating a copy without it
      const { sellerId, ...submitValues } = values;
      console.log('📝 Submitting without sellerId (seller selection hidden)');
      onSubmit(submitValues as ProductFormValues);
    } else {
      console.log('📝 Submitting with sellerId (seller selection visible)');
      onSubmit(values);
    }
  }, [onSubmit, showSellerSelection, imageUrls.length]);

  const handleFormSubmit = useCallback(() => {
    console.log('🎯 Form submit triggered, current form errors:', form.formState.errors);
    form.handleSubmit(handleSubmit)();
  }, [form, handleSubmit]);

  const hasImages = imageUrls.length > 0;

  // Популярные бренды
  const POPULAR_BRANDS = [
    "toyota", "honda", "ford", "chevrolet", "nissan", 
    "hyundai", "kia", "volkswagen", "bmw", "mercedes-benz"
  ];

  const popularBrandIds = filteredBrands
    .filter(brand => POPULAR_BRANDS.includes(brand.name.toLowerCase()))
    .map(brand => brand.id);

  const handleVideoUpload = (newUrls: string[]) => {
    setVideoUrls(prevUrls => [...prevUrls, ...newUrls]);
  };

  const handleVideoDelete = (urlToDelete: string) => {
    setVideoUrls(prevUrls => prevUrls.filter(url => url !== urlToDelete));
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={`space-y-6 ${isMobile ? 'pb-24' : ''}`}>
          
          {/* ЕДИНЫЙ БЛОК СО ВСЕЙ ИНФОРМАЦИЕЙ */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Информация о товаре</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Выбор продавца - только для админа */}
              {showSellerSelection && (
                <FormField
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Продавец *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="text-base">
                            <SelectValue placeholder="Выберите продавца" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sellers.map((seller) => (
                            <SelectItem key={seller.id} value={seller.id}>
                              {seller.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Название товара */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название товара *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Например: Фара передняя левая BMW X5"
                        {...field}
                        className="text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Цена и доставка рядом */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Цена * ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="100"
                          {...field}
                          className="text-base"
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
                          placeholder="0"
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="placeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Количество мест *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1"
                          {...field}
                          className="text-base"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Информация об автомобиле */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Информация об автомобиле</h3>
                <div className={`grid grid-cols-1 ${isMobile ? "gap-6" : "md:grid-cols-2 gap-4"}`}>
                  <FormField
                    control={form.control}
                    name="brandId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className={isMobile ? "text-base font-medium" : ""}>
                          Марка автомобиля *
                        </FormLabel>
                        <FormControl>
                          <EnhancedVirtualizedSelect
                            options={filteredBrands}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Выберите марку"
                            searchPlaceholder="Поиск бренда..."
                            disabled={isLoadingCarData}
                            className={isMobile ? "h-12" : ""}
                            popularOptions={popularBrandIds}
                            searchTerm={searchBrandTerm}
                            onSearchChange={setSearchBrandTerm}
                            showResultCount={true}
                          />
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
                        <FormLabel className={isMobile ? "text-base font-medium" : ""}>
                          Модель (необязательно)
                        </FormLabel>
                        <FormControl>
                          <EnhancedVirtualizedSelect
                            options={filteredModels}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Выберите модель"
                            searchPlaceholder="Поиск модели..."
                            disabled={!watchBrandId || isLoadingCarData}
                            className={isMobile ? "h-12" : ""}
                            searchTerm={searchModelTerm}
                            onSearchChange={setSearchModelTerm}
                            showResultCount={true}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Описание */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Дополнительная информация о товаре..."
                        className="resize-none text-base"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Загрузка фотографий */}
              <div className="space-y-4">
                <h3 className="text-base font-medium">Фотографии товара</h3>
                <MobileOptimizedImageUpload
                  onUploadComplete={handleMobileOptimizedImageUpload}
                  maxImages={30}
                  existingImages={imageUrls}
                  onImageDelete={onImageDelete}
                  onSetPrimaryImage={setPrimaryImage}
                  primaryImage={primaryImage}
                  buttonText="Добавить фотографии"
                />
                {imageUrls.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Добавьте хотя бы одну фотографию для создания товара
                  </p>
                )}
              </div>

              {/* Загрузка видео */}
              <div className="space-y-4">
                <CloudinaryVideoUpload
                  videos={videoUrls}
                  onUpload={handleVideoUpload}
                  onDelete={handleVideoDelete}
                  maxVideos={3}
                  productId={undefined}
                />
              </div>
            </CardContent>
          </Card>
          
          {!isMobile && (
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting || !hasImages}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Создание товара...
                </>
              ) : !hasImages ? (
                'Сначала добавьте фотографии'
              ) : (
                'Создать товар'
              )}
            </Button>
          )}
        </form>
      </Form>

      <StickyMobileActions
        isSubmitting={isSubmitting}
        onSubmit={handleFormSubmit}
        disabled={!hasImages}
        submitText={!hasImages ? 'Добавьте фотографии' : 'Создать товар'}
      />
    </>
  );
});

OptimizedAddProductForm.displayName = "OptimizedAddProductForm";

export default OptimizedAddProductForm;
