
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, ShieldCheck, CircleDollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [showPhone, setShowPhone] = useState(false);
  
  // Fetch product data from Supabase
  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          product_images(url, is_primary),
          profiles!products_seller_id_fkey(full_name, rating, phone, opt_id)
        `)
        .eq("id", id)
        .single();
      
      if (error) {
        console.error("Error fetching product:", error);
        throw new Error("Failed to fetch product");
      }
      
      return data;
    },
    enabled: !!id,
  });

  // Extract the primary image or first available image
  const getImageUrl = () => {
    if (product?.product_images && product.product_images.length > 0) {
      // Find primary image first
      const primaryImage = product.product_images.find(img => img.is_primary);
      // Use primary image if found, otherwise use the first image
      if (primaryImage) {
        return primaryImage.url;
      } else if (product.product_images[0]) {
        return product.product_images[0].url;
      }
    }
    return "https://images.unsplash.com/photo-1562687877-3c98ca2834c9?q=80&w=800&auto=format&fit=crop";
  };

  // Get all images for the product
  const getProductImages = () => {
    if (product?.product_images && product.product_images.length > 0) {
      return product.product_images.map(img => img.url);
    }
    return [getImageUrl()];
  };

  const handleShowPhone = () => {
    setShowPhone(true);
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
          {/* Product Images */}
          <div>
            <div className="mb-4 overflow-hidden rounded-lg">
              <img 
                src={getImageUrl()} 
                alt={product.title}
                className="w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <div key={index} className="overflow-hidden rounded-md border-2 border-transparent hover:border-optapp-yellow cursor-pointer">
                  <img src={image} alt={`${product.title} ${index + 1}`} className="w-full h-24 object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-optapp-yellow text-optapp-dark">{product.condition}</Badge>
              <span className="text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-1" /> {product.location || "Не указано"}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
            <div className="text-2xl font-bold text-optapp-dark mb-4">
              {product.price} AED
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="border rounded p-2">
                  <div className="text-gray-500">Бренд</div>
                  <div className="font-medium">{product.brand}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-gray-500">Модель</div>
                  <div className="font-medium">{product.model}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-gray-500">Номер лота</div>
                  <div className="font-medium">{product.lot_number}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Описание:</h3>
                <p className="text-gray-700">{product.description || "Описание отсутствует"}</p>
              </div>
            </div>
            
            {/* Seller Info & Actions */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-2">Продавец: {product.seller_name}</h3>
              {sellerProfile && (
                <div className="mb-3 space-y-2">
                  {sellerProfile.opt_id && (
                    <div className="text-sm">
                      <span className="text-gray-500">OPT ID: </span>
                      <span className="font-medium">{sellerProfile.opt_id}</span>
                    </div>
                  )}
                  {sellerProfile.rating && (
                    <div className="flex items-center">
                      <div className="text-yellow-500">★★★★★</div>
                      <div className="ml-1">
                        {sellerProfile.rating} отзывов
                      </div>
                    </div>
                  )}
                </div>
              )}
              <Button 
                className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 mb-2"
                onClick={handleShowPhone}
              >
                <Phone className="mr-2 h-4 w-4" />
                {showPhone && sellerProfile?.phone 
                  ? sellerProfile.phone 
                  : "Показать номер"}
              </Button>
              <Button variant="outline" className="w-full border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white">
                Написать продавцу
              </Button>
            </div>
            
            {/* Additional Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-700">
                <ShieldCheck className="h-5 w-5 mr-2 text-optapp-yellow" />
                <span>Безопасная сделка через платформу</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CircleDollarSign className="h-5 w-5 mr-2 text-optapp-yellow" />
                <span>Гарантия возврата денег в течение 14 дней</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
