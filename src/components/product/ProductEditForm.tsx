
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import { supabase } from "@/integrations/supabase/client";
import { AdminProductImagesManager } from "@/components/admin/AdminProductImagesManager";
import { AdminProductVideosManager } from "@/components/admin/AdminProductVideosManager";

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

  const [formData, setFormData] = React.useState({
    title: product.title,
    price: typeof product.price === "string" ? parseFloat(product.price) : product.price,
    description: product.description || "",
    brand: product.brand || "",
    model: product.model || "",
    place_number: product.place_number || 1,
  });

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

  React.useEffect(() => {
    setImages(
      Array.isArray(product.product_images) ? product.product_images.map((img: any) => img.url) : []
    );
    setVideos(
      Array.isArray(product.product_videos) ? product.product_videos.map((vid: any) => vid.url) : []
    );
  }, [product]);

  React.useEffect(() => {
    // Check if user is the creator (owner) of the product
    const checkIsCreator = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        // If we're not explicitly set as creator and auth check fails, default to false
        if (!isCreator && (!user || user.id !== product.seller_id)) {
          console.log("User is not the creator of this product");
        }
      } catch (error) {
        console.error("Error checking product ownership:", error);
      }
    };
    
    checkIsCreator();
  }, [isCreator, product.seller_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCreator) {
      toast({
        title: "Действие запрещено",
        description: "Только продавец может редактировать объявление",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("products")
        .update({
          title: formData.title,
          price: formData.price,
          description: formData.description,
          brand: formData.brand,
          model: formData.model,
          place_number: formData.place_number,
        })
        .eq("id", product.id);

      if (error) throw error;

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
      className="bg-white rounded-2xl shadow-md mx-auto w-full max-w-3xl flex flex-col md:flex-row items-stretch gap-6 p-4"
      style={{
        minHeight: "440px",
        maxWidth: "98vw",
      }}
    >
      {/* Media Section */}
      <div className="flex flex-col gap-4 md:w-2/5 w-full border-r-0 md:border-r md:pr-4 md:border-gray-100">
        <div>
          <AdminProductImagesManager
            productId={product.id}
            images={images}
            onImagesChange={isCreator ? setImages : () => {}}
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

      {/* Information Section */}
      <div className="flex-1 flex flex-col gap-2">
        <Input
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Название товара"
          className="text-base font-bold h-8"
          disabled={!isCreator}
        />
        <Input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
          placeholder="Цена"
          className="h-8"
          disabled={!isCreator}
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="Марка"
            className="h-8"
            disabled={!isCreator}
          />
          <Input
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="Модель"
            className="h-8"
            disabled={!isCreator}
          />
        </div>
        <Input
          type="number"
          min="1"
          value={formData.place_number}
          onChange={(e) => setFormData({ ...formData, place_number: parseInt(e.target.value) || 1 })}
          placeholder="Количество мест для отправки"
          className="h-8"
          disabled={!isCreator}
        />
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Описание товара"
          className="min-h-[36px] max-h-[80px] text-sm"
          rows={2}
          disabled={!isCreator}
        />

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
      </div>
    </form>
  );
};

export default ProductEditForm;
