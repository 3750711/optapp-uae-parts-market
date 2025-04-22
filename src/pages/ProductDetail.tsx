import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/product";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import SellerInfo from "@/components/product/SellerInfo";
import ContactButtons from "@/components/product/ContactButtons";
import ProductVideos from "@/components/product/ProductVideos";
import { useIsMobile } from "@/hooks/use-mobile";
import { ProductEditDialog } from "@/components/admin/ProductEditDialog";
import { useAdminAccess } from "@/hooks/useAdminAccess";

const ProductDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const { isAdmin } = useAdminAccess();
  const [adminEditOpen, setAdminEditOpen] = React.useState(false);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images(url, is_primary),
          profiles!products_seller_id_fkey(full_name, rating, phone, opt_id, telegram),
          product_videos(url)
        `)
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Error fetching product:", error);
        throw new Error("Failed to fetch product");
      }
      
      console.log("Fetched product details:", data);
      console.log("Product ID from API:", data.id);
      return data as Product;
    },
    enabled: !!id,
  });

  const getImageUrl = () => {
    if (product?.product_images && product.product_images.length > 0) {
      const primaryImage = product.product_images.find(img => img.is_primary);
      if (primaryImage) {
        return primaryImage.url;
      } else if (product.product_images[0]) {
        return product.product_images[0].url;
      }
    }
    return "https://images.unsplash.com/photo-1562687877-3c98ca2834c9?q=80&w=800&auto=format&fit=crop";
  };

  const getProductImages = () => {
    if (product?.product_images && product.product_images.length > 0) {
      return product.product_images.map(img => img.url);
    }
    return [getImageUrl()];
  };

  const getProductVideos = () => {
    if (product?.product_videos && Array.isArray(product.product_videos) && product.product_videos.length > 0) {
      return product.product_videos.map((video: { url: string }) => video.url);
    }
    if (product?.videos && Array.isArray(product.videos) && product.videos.length > 0) {
      return product.videos;
    }
    if (product?.video_url && typeof product.video_url === "string") {
      return [product.video_url];
    }
    return [];
  };

  const handleContactTelegram = () => {
    if (product?.telegram_url) {
      const productUrl = product?.product_url || `https://preview--optapp-uae-parts-market.lovable.app/product/${id}`;
      const message = `${productUrl} I'm interested in this product, please can you send pore information`;
      window.open(`https://t.me/${product.telegram_url}?text=${message}`, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Ошибка",
        description: "Telegram продавца недоступен",
        variant: "destructive"
      });
    }
  };

  const handleContactWhatsApp = () => {
    if (product?.phone_url) {
      const productUrl = product?.product_url || `https://preview--optapp-uae-parts-market.lovable.app/product/${id}`;
      const message = `${productUrl} I'm interested in this product, please can you send pore information`;
      window.open(`https://wa.me/${product.phone_url}?text=${message}`, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Ошибка",
        description: "Номер телефона продавца недоступен",
        variant: "destructive"
      });
    }
  };

  const handleProductUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ["product", id] });
  };

  const handleAdminEditSuccess = () => {
    setAdminEditOpen(false);
    handleProductUpdate();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg">Загрузка данных о товаре...</p>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-lg text-red-500">Ошибка при загрузке данных о товаре</p>
          <p className="text-gray-500 mt-2">Товар не найден или произошла ошибка при загрузке</p>
        </div>
      </Layout>
    );
  }

  const images = getProductImages();
  const videos = getProductVideos();
  const sellerProfile = product.profiles;
  const productPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const sellerName = product.seller_name || (sellerProfile?.full_name || "Неизвестный продавец");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mr-4" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Назад
          </Button>
          {isAdmin && product && (
            <div className="flex justify-end mb-4">
              <ProductEditDialog
                product={product}
                trigger={
                  <button
                    className="px-5 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
                    onClick={() => setAdminEditOpen(true)}
                    type="button"
                  >
                    Редактировать как администратор
                  </button>
                }
                onSuccess={handleAdminEditSuccess}
                open={adminEditOpen}
                setOpen={setAdminEditOpen}
              />
            </div>
          )}
        </div>
        {isMobile ? (
          <div className="flex flex-col gap-3">
            <div className="mt-2">
              <ProductGallery images={images} title={product.title} />
            </div>
            <div>
              <ProductInfo
                product={product}
                onProductUpdate={handleProductUpdate}
              />
              <ProductSpecifications
                brand={product.brand || ""}
                model={product.model || ""}
                lot_number={product.lot_number || ""}
              />
              <SellerInfo
                sellerProfile={sellerProfile || {}}
                seller_name={sellerName}
              >
                <div className="flex flex-col gap-2">
                  <ContactButtons
                    onContactTelegram={handleContactTelegram}
                    onContactWhatsApp={handleContactWhatsApp}
                    telegramUrl={product.telegram_url}
                    product={{
                      id: product.id,
                      title: product.title,
                      price: productPrice,
                      brand: product.brand,
                      model: product.model,
                      description: product.description,
                      optid_created: product.optid_created,
                      seller_id: product.seller_id,
                      seller_name: sellerName,
                      lot_number: product.lot_number,
                      status: product.status
                    }}
                  />
                </div>
              </SellerInfo>
            </div>
            <div className="mt-2">
              <ProductVideos videos={videos} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8">
            <div>
              <div className="mb-4">
                <ProductGallery images={images} title={product.title} />
              </div>
              <div className="mb-8">
                <ProductVideos videos={videos} />
              </div>
            </div>
            <div>
              <ProductInfo
                product={product}
                onProductUpdate={handleProductUpdate}
              />
              <ProductSpecifications
                brand={product.brand || ""}
                model={product.model || ""}
                lot_number={product.lot_number || ""}
              />
              <SellerInfo
                sellerProfile={sellerProfile || {}}
                seller_name={sellerName}
              >
                <div className="flex flex-col gap-2">
                  <ContactButtons
                    onContactTelegram={handleContactTelegram}
                    onContactWhatsApp={handleContactWhatsApp}
                    telegramUrl={product.telegram_url}
                    product={{
                      id: product.id,
                      title: product.title,
                      price: productPrice,
                      brand: product.brand,
                      model: product.model,
                      description: product.description,
                      optid_created: product.optid_created,
                      seller_id: product.seller_id,
                      seller_name: sellerName,
                      lot_number: product.lot_number,
                      status: product.status
                    }}
                  />
                </div>
              </SellerInfo>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductDetail;
