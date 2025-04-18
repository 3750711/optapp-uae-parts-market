
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import ContactButtons from "@/components/product/ContactButtons";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import ProductSpecifications from "@/components/product/ProductSpecifications";
import SellerInfo from "@/components/product/SellerInfo";
import { toast } from "@/hooks/use-toast";
import { Product } from "@/types/product";

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch product data here
    // This is a placeholder. In a real app, you would fetch from an API
    const fetchProduct = async () => {
      try {
        // Mock data for demonstration
        const mockProduct: Product = {
          id: id || "1",
          title: "Sample Product",
          price: 299.99,
          description: "A sample product description",
          condition: "New",
          seller_name: "Sample Seller",
          telegram_url: "sample_seller",
          phone_url: "971501234567",
          product_images: [{ url: "/placeholder.svg" }]
        };
        
        setProduct(mockProduct);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching product:", error);
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [id]);

  const handleContactTelegram = () => {
    if (product?.telegram_url) {
      const productUrl = product?.product_url || `https://preview--optapp-uae-parts-market.lovable.app/product/${id}`;
      const message = `I'm interested in this product, ${productUrl} please can you send more information`;
      window.open(`https://t.me/${product.telegram_url}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
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
      const message = `I'm interested in this product, ${productUrl} please can you send more information`;
      window.open(`https://wa.me/${product.phone_url}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: "Ошибка",
        description: "Номер телефона продавца недоступен",
        variant: "destructive"
      });
    }
  };

  const handleBuyNow = () => {
    // Implement buy now logic
    toast({
      title: "Покупка",
      description: "Функция покупки товара будет доступна в ближайшее время",
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-12">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!product) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <div className="text-center py-12">Product not found</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            {product.product_images && <ProductGallery images={product.product_images} />}
            <ProductInfo product={product} />
            <ProductSpecifications product={product} />
          </div>
          <div className="space-y-6">
            <SellerInfo seller={product.profiles || { full_name: product.seller_name }} />
            <div className="border p-4 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Контакты</h2>
              <ContactButtons 
                onBuyNow={handleBuyNow}
                onContactTelegram={handleContactTelegram}
                onContactWhatsApp={handleContactWhatsApp}
                telegramUrl={product.telegram_url}
                phoneUrl={product.phone_url}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
