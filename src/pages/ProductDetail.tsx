import React from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Product } from "@/types/product";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import SellerInfo from "@/components/product/SellerInfo";
import ContactButtons from "@/components/product/ContactButtons";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images(url, is_primary),
          profiles!products_seller_id_fkey(full_name, rating, phone, opt_id, telegram)
        `)
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Error fetching product:", error);
        throw new Error("Failed to fetch product");
      }
      
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

  const handleContactTelegram = () => {
    if (product?.profiles?.telegram) {
      const telegramUsername = product.profiles.telegram.replace(/^@/, '');
      console.log("Открываем Telegram чат с пользователем:", telegramUsername);
      window.open(`https://t.me/${telegramUsername}`, '_blank', 'noopener,noreferrer');
    } else {
      console.log("No Telegram username found, using general share URL");
      const sellerName = product?.seller_name || "продавцом";
      const productTitle = product?.title || "товаром";
      const message = encodeURIComponent(`Здравствуйте, я заинтересован в товаре "${productTitle}"`);
      window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${message}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBuyNow = () => {
    toast({
      title: "Товар добавлен в корзину",
      description: `"${product?.title}" успешно добавлен в вашу корзину`,
      variant: "default"
    });
  };

  const handleContactWhatsApp = () => {
    if (product?.profiles?.phone) {
      const cleanPhone = product.profiles.phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;
      const message = encodeURIComponent(`Здравствуйте, я заинтересован в товаре "${product.title}"`);
      window.open(`https://wa.me/${formattedPhone}?text=${message}`, '_blank', 'noopener,noreferrer');
    } else {
      alert('Номер телефона продавца недоступен');
    }
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
  const sellerProfile = product.profiles;
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ProductGallery images={images} title={product.title} />
          </div>

          <div>
            <ProductInfo 
              title={product.title}
              price={product.price}
              condition={product.condition}
              location={product.location || ""}
              description={product.description || ""}
            />
            
            <ProductSpecifications 
              brand={product.brand || ""}
              model={product.model || ""}
              lot_number={product.lot_number || ""}
            />
            
            <SellerInfo 
              sellerProfile={sellerProfile || {}} 
              seller_name={product.seller_name}
            >
              <ContactButtons
                onBuyNow={handleBuyNow}
                onContactTelegram={handleContactTelegram}
                onContactWhatsApp={handleContactWhatsApp}
              />
            </SellerInfo>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
