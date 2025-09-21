import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock } from 'lucide-react';
import ProductGrid from '@/components/product/ProductGrid';
import ProductSkeleton from '@/components/catalog/ProductSkeleton';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductProps } from '@/components/product/ProductCard';

type ProductType = {
  id: string;
  title: string;
  price: number | string;
  product_images?: { url: string; is_primary?: boolean }[];
  profiles?: { location?: string; opt_id?: string; rating?: number; opt_status?: string; verification_status?: string };
  condition?: string;
  location?: string;
  optid_created?: string | null;
  rating_seller?: number | null;
  brand?: string;
  model?: string;
  seller_name: string;
  status: 'pending' | 'active' | 'sold' | 'archived';
  seller_id: string;
  created_at: string;
  delivery_price?: number | null;
  has_preview?: boolean;
  cloudinary_public_id?: string | null;
  cloudinary_url?: string | null;
};

const FeaturedProductsSection = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer для lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById('featured-products');
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, []);

  // Загружаем товары с cloudinary данными
  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, is_primary), profiles:seller_id(*), cloudinary_public_id, cloudinary_url')
        .eq('status', 'active')
        .order('catalog_position', { ascending: false })
        .limit(8);

      if (error) throw error;
      return data || [];
    },
    enabled: isVisible,
    staleTime: 300000,
  });

  // Преобразование данных в нужный формат
  const mappedProducts: ProductProps[] = (products || []).map((product) => {
    const typedProduct = product as unknown as ProductType;
    
    let imageUrl = "/placeholder.svg";
    
    if (typedProduct.product_images && typedProduct.product_images.length > 0) {
      const primaryImage = typedProduct.product_images.find(img => img.is_primary);
      if (primaryImage) {
        imageUrl = primaryImage.url;
      } else if (typedProduct.product_images[0]) {
        imageUrl = typedProduct.product_images[0].url;
      }
    }
    
    return {
      id: typedProduct.id,
      title: typedProduct.title,
      price: Number(typedProduct.price),
      image: imageUrl,
      brand: typedProduct.brand || "",
      model: typedProduct.model || "",
      condition: typedProduct.condition || "Новое",
      seller_name: typedProduct.seller_name,
      status: typedProduct.status,
      seller_id: typedProduct.seller_id,
      delivery_price: typedProduct.delivery_price,
      optid_created: typedProduct.optid_created,
      cloudinary_public_id: typedProduct.cloudinary_public_id,
      cloudinary_url: typedProduct.cloudinary_url
    } as ProductProps;
  });

  return (
    <section id="featured-products" className="py-12 md:py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center justify-center gap-2">
            <Clock className="h-6 w-6 text-blue-500" />
            <span>Последние опубликованные</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Самые свежие автозапчасти от проверенных поставщиков
          </p>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : mappedProducts.length > 0 ? (
          <>
            <div className="mb-8">
              <ProductGrid products={mappedProducts} />
            </div>
            
            <div className="text-center">
              <Button size="lg" className="group" asChild>
                <Link to="/catalog">
                  Смотреть все товары
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Товары скоро появятся</p>
            <Button asChild>
              <Link to="/catalog">Перейти в каталог</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProductsSection;
