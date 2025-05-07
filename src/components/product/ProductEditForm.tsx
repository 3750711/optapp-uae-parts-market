
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { AdminProductVideosManager } from "@/components/admin/AdminProductVideosManager";
import { ImageUpload } from "@/components/ui/image-upload";
import { useIsMobile } from "@/hooks/use-mobile";
import { useCarBrandsAndModels } from "@/hooks/useCarBrandsAndModels";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface ProductEditFormProps {
  product: Product;
  onCancel: () => void;
  onSave: () => void;
  isCreator?: boolean;
}

const ProductEditForm: React.FC<ProductEditFormProps> = ({
  product,
  onCancel,
  onSave,
  isCreator = false,
}) => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [formData, setFormData] = React.useState({
    title: product.title,
    price: typeof product.price === "string" ? parseFloat(product.price) : product.price,
    description: product.description || "",
    brand: product.brand || "",
    model: product.model || "",
    place_number: product.place_number || 1,
    delivery_price: typeof product.delivery_price === "string" 
      ? parseFloat(product.delivery_price) 
      : product.delivery_price || 0,
  });

  // Use our car brands and models hook
  const { 
    brands, 
    brandModels, 
    selectedBrand, 
    selectBrand, 
    isLoading: loadingBrands,
    findBrandIdByName
  } = useCarBrandsAndModels();

  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  const [images, setImages] = React.useState<string[]>(
    Array.isArray(product.product_images)
      ? product.product_images.map((img: any) => img.url)
      : []
  );
  const [videos, setVideos] = React.useState<string[]>(
    Array.isArray(product.product_videos)
      ? product.product_videos.map((vid: any) => vid.url)
      : []
  );

  // Set initial selected brand when the component mounts and brands are loaded
  useEffect(() => {
    if (brands.length > 0 && product.brand) {
      const brandId = findBrandIdByName(product.brand);
      if (brandId) {
        selectBrand(brandId);
      }
    }
  }, [brands, product.brand, findBrandIdByName, selectBrand]);

  React.useEffect(() => {
    setImages(
      Array.isArray(product.product_images) ? product.product_images.map((img: any) => img.url) : []
    );
    setVideos(
      Array.isArray(product.product_videos) ? product.product_videos.map((vid: any) => vid.url) : []
    );
  }, [product]);

  React.useEffect(() => {
    const checkIsCreator = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!isCreator && (!user || user.id !== product.seller_id)) {
          console.log("User is not the creator of this product");
        }
      } catch (error) {
        console.error("Error checking product ownership:", error);
      }
    };
    checkIsCreator();
  }, [isCreator, product.seller_id]);

  // When brand changes, update formData and reset model
  const handleBrandChange = (brandId: string) => {
    selectBrand(brandId);
    setSelectedModelId(null);
    
    const selectedBrand = brands.find(b => b.id === brandId);
    if (selectedBrand) {
      setFormData({
        ...formData,
        brand: selectedBrand.name,
        model: '' // Reset model when brand changes
      });
    }
  };

  // When model changes, update formData
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    
    const selectedModel = brandModels.find(m => m.id === modelId);
    if (selectedModel) {
      setFormData({
        ...formData,
        model: selectedModel.name
      });
    }
  };

  const handleImageUpload = async (newUrls: string[]) => {
    try {
      const imageInserts = newUrls.map(url => ({
        product_id: product.id,
        url: url,
        is_primary: false
      }));

      const { error } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (error) throw error;

      setImages([...images, ...newUrls]);
      toast({
        title: "Фото добавлены",
        description: `Добавлено ${newUrls.length} фотографий`,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось добавить фотографии",
        variant: "destructive",
      });
    }
  };

  const handleImageDelete = async (urlToDelete: string) => {
    try {
      const { error } = await supabase
        .from('product_images')
        .delete()
        .eq('product_id', product.id)
        .eq('url', urlToDelete);

      if (error) throw error;

      setImages(images.filter(url => url !== urlToDelete));
      toast({
        title: "Фото удалено",
        description: "Фотография успешно удалена",
      });
    } catch (error) {
      console.error("Error deleting image:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось удалить фотографию",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCreator) {
      toast({
        title: "Действие запрещено",
        description: "Только продавец может редактировать объявленые",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Handle null model value properly
      const modelValue = formData.model === "" ? null : formData.model;
      
      const { error } = await supabase
        .from("products")
        .update({
          title: formData.title,
          price: formData.price,
          description: formData.description,
          brand: formData.brand,
          model: modelValue, // This can now be null
          place_number: formData.place_number,
          delivery_price: formData.delivery_price,
        })
        .eq("id", product.id);

      if (error) {
        console.error("Error details:", error);
        throw error;
      }

      toast({
        title: "Успешно",
        description: "Объявление обновлено",
      });

      onSave();
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить объявление",
        variant: "destructive",
      });
      console.error("Error updating product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-white rounded-2xl shadow-md mx-auto w-full flex flex-col ${isMobile ? "gap-2 p-2" : "md:flex-row gap-6 p-4 max-w-3xl"}`}
      style={{
        minHeight: "440px",
        maxWidth: isMobile ? "100vw" : "98vw",
      }}
    >
      <div className={isMobile ? "mb-2 border-b pb-3" : "flex flex-col gap-4 md:w-2/5 w-full border-r-0 md:border-r md:pr-4 md:border-gray-100"}>
        <div>
          <ImageUpload 
            images={images}
            onUpload={handleImageUpload}
            onDelete={handleImageDelete}
            maxImages={10}
          />
        </div>
        <div>
          <AdminProductVideosManager
            productId={product.id}
            videos={videos}
            onVideosChange={isCreator ? setVideos : () => {}}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-1 sm:gap-2">
        <label htmlFor="title" className="text-xs sm:text-sm font-medium">Название товара</label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Название товара"
          className="text-base font-bold h-8 sm:h-8"
          disabled={!isCreator}
        />

        <label htmlFor="price" className="text-xs sm:text-sm font-medium">Цена</label>
        <Input
          id="price"
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          placeholder="Цена"
          className="h-8 sm:h-8"
          disabled={!isCreator}
        />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label htmlFor="brand" className="text-xs sm:text-sm font-medium">Марка</label>
            <Select
              disabled={!isCreator || loadingBrands}
              value={selectedBrand || ""}
              onValueChange={handleBrandChange}
            >
              <SelectTrigger id="brand" className="h-8 sm:h-8">
                <SelectValue placeholder="Выберите марку" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.id}>{brand.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="model" className="text-xs sm:text-sm font-medium">Модель (необязательно)</label>
            <Select
              disabled={!isCreator || !selectedBrand || loadingBrands}
              value={selectedModelId || ""}
              onValueChange={handleModelChange}
            >
              <SelectTrigger id="model" className="h-8 sm:h-8">
                <SelectValue placeholder="Выберите модель" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {brandModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>{model.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <label htmlFor="place_number" className="text-xs sm:text-sm font-medium">Количество мест для отправки</label>
        <Input
          id="place_number"
          type="number"
          min="1"
          value={formData.place_number}
          onChange={(e) => setFormData({ ...formData, place_number: parseInt(e.target.value) || 1 })}
          placeholder="Количество мест для отправки"
          className="h-8 sm:h-8"
          disabled={!isCreator}
        />

        <label htmlFor="description" className="text-xs sm:text-sm font-medium">Описание товара</label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Описание товара"
          className="min-h-[36px] max-h-[80px] text-xs sm:text-sm"
          rows={2}
          disabled={!isCreator}
        />

        <label htmlFor="delivery_price" className="text-xs sm:text-sm font-medium">Стоимость доставки</label>
        <Input
          id="delivery_price"
          type="number"
          value={formData.delivery_price}
          onChange={(e) => setFormData({ 
            ...formData, 
            delivery_price: parseFloat(e.target.value) || 0 
          })}
          placeholder="Стоимость доставки"
          className="h-8 sm:h-8"
          disabled={!isCreator}
        />

        {isMobile ? (
          <div className="fixed bottom-0 left-0 w-full bg-white z-40 border-t flex justify-between p-2 gap-1 rounded-none shadow-xl">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="h-9 flex-1 text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Отмена
            </Button>
            <Button
              type="submit"
              className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 h-9 flex-1 text-xs"
              disabled={isLoading || !isCreator}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-2 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="h-8 px-3 text-xs"
            >
              <X className="h-4 w-4 mr-1" />
              Отмена
            </Button>
            <Button
              type="submit"
              className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 h-8 px-3 text-xs"
              disabled={isLoading || !isCreator}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Сохранить
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </form>
  );
};

export default ProductEditForm;
