import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useCarBrandsAndModels } from '@/hooks/useCarBrandsAndModels';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useSubmissionGuard } from '@/hooks/useSubmissionGuard';
import { Product } from '@/types/product';
import BasicInfoSection from './form/BasicInfoSection';
import PriceSection from './form/PriceSection';
import DescriptionSection from './form/DescriptionSection';
import SimpleCarSelector from '@/components/ui/SimpleCarSelector';
import MediaUploadSection from './form/MediaUploadSection';

// Schema for form validation
const productSchema = z.object({
  title: z.string().min(3, 'Название должно содержать минимум 3 символа'),
  price: z.number().min(0, 'Цена не может быть отрицательной'),
  description: z.string().optional(),
  brandId: z.string().optional(),
  modelId: z.string().optional(),
  place_number: z.number().int().min(1).max(10).default(1),
  delivery_price: z.number().min(0).default(0),
});

export type ProductFormValues = z.infer<typeof productSchema>;

interface OptimizedAddProductFormProps {
  onSuccess?: (productId: string) => void;
  initialProductData?: Partial<Product>;
  isMobile?: boolean;
}

const OptimizedAddProductForm: React.FC<OptimizedAddProductFormProps> = ({
  onSuccess,
  initialProductData,
  isMobile: propIsMobile
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobileDevice = useIsMobile();
  const isMobile = propIsMobile !== undefined ? propIsMobile : isMobileDevice;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [searchBrandTerm, setSearchBrandTerm] = useState('');
  const [searchModelTerm, setSearchModelTerm] = useState('');

  // Car brands and models
  const {
    brands,
    allModels,
    findBrandNameById,
    findModelNameById,
    isLoading: isLoadingCarData
  } = useCarBrandsAndModels();

  // Form with validation
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: initialProductData?.title || '',
      price: initialProductData?.price ? Number(initialProductData.price) : 0,
      description: initialProductData?.description || '',
      brandId: initialProductData?.brand_id || '',
      modelId: initialProductData?.model_id || '',
      place_number: initialProductData?.place_number || 1,
      delivery_price: initialProductData?.delivery_price ? Number(initialProductData.delivery_price) : 0,
    },
  });

  // Watch brand ID for filtering models
  const watchBrandId = form.watch('brandId');

  // Filter models for selected brand
  const filteredModelsByBrand = useMemo(() => {
    if (!watchBrandId) return [];
    return allModels.filter(model => model.brand_id === watchBrandId);
  }, [allModels, watchBrandId]);

  // Simple filtered brands
  const filteredBrands = useMemo(() => {
    if (!searchBrandTerm) return brands;
    return brands.filter(brand => 
      brand.name.toLowerCase().includes(searchBrandTerm.toLowerCase())
    );
  }, [brands, searchBrandTerm]);

  // Simple filtered models
  const filteredModels = useMemo(() => {
    if (!searchModelTerm) return filteredModelsByBrand;
    return filteredModelsByBrand.filter(model => 
      model.name.toLowerCase().includes(searchModelTerm.toLowerCase())
    );
  }, [filteredModelsByBrand, searchModelTerm]);

  // Submission guard to prevent duplicate submissions
  const { guardedSubmit } = useSubmissionGuard({
    timeout: 5000,
    onDuplicateSubmit: () => {
      toast({
        title: "Форма уже отправляется",
        description: "Пожалуйста, дождитесь завершения текущей операции",
        variant: "destructive",
      });
    }
  });

  const onSubmit = async (data: ProductFormValues) => {
    if (!user) {
      toast({
        title: "Ошибка авторизации",
        description: "Вы должны быть авторизованы для создания товара",
        variant: "destructive",
      });
      return;
    }

    guardedSubmit(async () => {
      try {
        setIsSubmitting(true);

        // Get brand and model names
        const brandName = data.brandId ? findBrandNameById(data.brandId) : null;
        const modelName = data.modelId ? findModelNameById(data.modelId) : null;

        const productData = {
          title: data.title,
          price: data.price,
          description: data.description || '',
          brand: brandName,
          model: modelName,
          brand_id: data.brandId || null,
          model_id: data.modelId || null,
          seller_id: user.id,
          images: images,
          videos: videos,
          place_number: data.place_number,
          delivery_price: data.delivery_price,
        };

        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();

        if (error) throw error;

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['products'] });
        queryClient.invalidateQueries({ queryKey: ['products-infinite'] });
        queryClient.invalidateQueries({ queryKey: ['sellerProfile'] });

        toast({
          title: "Товар создан",
          description: "Ваш товар успешно добавлен в каталог",
        });

        if (onSuccess && newProduct) {
          onSuccess(newProduct.id);
        } else {
          navigate('/profile/products');
        }
      } catch (error) {
        console.error('Error creating product:', error);
        toast({
          title: "Ошибка",
          description: "Не удалось создать товар. Пожалуйста, попробуйте еще раз.",
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    });
  };

  const handleImageUpload = (urls: string[]) => {
    setImages(prev => [...prev, ...urls]);
  };

  const handleImageDelete = (url: string) => {
    setImages(prev => prev.filter(img => img !== url));
  };

  const handleVideoUpload = (urls: string[]) => {
    setVideos(prev => [...prev, ...urls]);
  };

  const handleVideoDelete = (url: string) => {
    setVideos(prev => prev.filter(v => v !== url));
  };

  // Handle brand and model changes
  const handleBrandChange = (brandId: string, brandName: string) => {
    form.setValue('brandId', brandId);
    // Reset model when brand changes
    form.setValue('modelId', '');
    setSearchModelTerm('');
  };

  const handleModelChange = (modelId: string, modelName: string) => {
    form.setValue('modelId', modelId);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <BasicInfoSection 
          form={form} 
          isMobile={isMobile} 
        />

        <SimpleCarSelector
          brandId={form.watch('brandId') || ''}
          modelId={form.watch('modelId') || ''}
          onBrandChange={handleBrandChange}
          onModelChange={handleModelChange}
          isMobile={isMobile}
          disabled={isSubmitting}
        />

        <PriceSection 
          form={form} 
          isMobile={isMobile} 
        />

        <DescriptionSection 
          form={form} 
          isMobile={isMobile} 
        />

        <MediaUploadSection
          images={images}
          videos={videos}
          onImageUpload={handleImageUpload}
          onImageDelete={handleImageDelete}
          onVideoUpload={handleVideoUpload}
          onVideoDelete={handleVideoDelete}
          disabled={isSubmitting}
          isMobile={isMobile}
        />

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className={isMobile ? "w-full" : ""}
          >
            {isSubmitting ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Создание товара...
              </>
            ) : (
              "Создать товар"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default OptimizedAddProductForm;
