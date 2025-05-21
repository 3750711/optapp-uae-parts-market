
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { OrderFormFields } from "./OrderFormFields";
import { MediaUploadSection } from "./MediaUploadSection";
import { CreatedOrderView } from "./CreatedOrderView";
import { useOrderFormLogic } from "./useOrderFormLogic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/types/product";

export const AdminFreeOrderForm = () => {
  const { user } = useAuth();
  const {
    formData,
    images,
    videos,
    buyerProfiles,
    sellerProfiles,
    selectedSeller,
    isLoading,
    createdOrder,
    brands,
    brandModels,
    isLoadingCarData,
    searchBrandTerm,
    setSearchBrandTerm,
    searchModelTerm,
    setSearchModelTerm,
    filteredBrands,
    filteredModels,
    setImages,
    setVideos,
    handleInputChange,
    handleImageUpload,
    handleOrderUpdate,
    handleSubmit,
    resetForm,
    navigate,
    parseTitleForBrand,
  } = useOrderFormLogic();
  
  // State for seller products
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  // Fetch seller products when a seller is selected
  useEffect(() => {
    const fetchSellerProducts = async () => {
      if (!selectedSeller) {
        setSellerProducts([]);
        return;
      }

      setIsLoadingProducts(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            product_images(*)
          `)
          .eq('seller_id', selectedSeller)
          .eq('status', 'active')
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Error fetching seller products:", error);
          return;
        }

        setSellerProducts(data as Product[] || []);
      } catch (err) {
        console.error("Unexpected error fetching seller products:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchSellerProducts();
  }, [selectedSeller]);

  // Handle product selection
  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
    const selectedProductData = sellerProducts.find(p => p.id === productId);
    
    if (selectedProductData) {
      // Update form data with product information
      handleInputChange('title', selectedProductData.title);
      handleInputChange('price', selectedProductData.price.toString());
      
      if (selectedProductData.delivery_price) {
        handleInputChange('delivery_price', selectedProductData.delivery_price.toString());
      }
      
      if (selectedProductData.brand) {
        handleInputChange('brand', selectedProductData.brand);
      }
      
      if (selectedProductData.model) {
        handleInputChange('model', selectedProductData.model || '');
      }
      
      if (selectedProductData.place_number) {
        handleInputChange('place_number', selectedProductData.place_number.toString());
      }
      
      if (selectedProductData.description) {
        handleInputChange('text_order', selectedProductData.description);
      }
      
      // Update images if available
      if (selectedProductData.product_images && selectedProductData.product_images.length > 0) {
        const productImages = selectedProductData.product_images.map(img => img.url);
        setImages(productImages);
      }
    }
  };

  if (createdOrder) {
    return (
      <CreatedOrderView
        order={createdOrder}
        images={images}
        onBack={() => navigate('/admin')}
        onNewOrder={resetForm}
        onOrderUpdate={handleOrderUpdate}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Информация о свободном заказе</CardTitle>
            <CardDescription>
              Заполните необходимые поля для создания нового заказа
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Product selection section - visible only when a seller is selected */}
              {selectedSeller && (
                <div className="space-y-2">
                  <Label htmlFor="product-select">Выберите товар продавца (опционально)</Label>
                  <Select
                    value={selectedProduct || ""}
                    onValueChange={handleProductSelect}
                    disabled={isLoadingProducts}
                  >
                    <SelectTrigger className="bg-white" id="product-select">
                      <SelectValue placeholder="Выберите товар для автозаполнения" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">- Не выбирать товар -</SelectItem>
                      {sellerProducts.length === 0 ? (
                        <SelectItem value="no_products" disabled>У продавца нет активных товаров</SelectItem>
                      ) : (
                        sellerProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title} - ${product.price}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    При выборе товара, поля формы будут автоматически заполнены данными из товара
                  </p>
                </div>
              )}

              <OrderFormFields
                formData={formData}
                handleInputChange={handleInputChange}
                buyerProfiles={buyerProfiles}
                sellerProfiles={sellerProfiles}
                selectedSeller={selectedSeller}
                brands={brands}
                brandModels={brandModels}
                isLoadingCarData={isLoadingCarData}
                searchBrandTerm={searchBrandTerm}
                setSearchBrandTerm={setSearchBrandTerm}
                searchModelTerm={searchModelTerm}
                setSearchModelTerm={setSearchModelTerm}
                filteredBrands={filteredBrands}
                filteredModels={filteredModels}
                parseTitleForBrand={parseTitleForBrand}
              />
              
              <MediaUploadSection
                images={images}
                videos={videos}
                onImagesUpload={handleImageUpload}
                onVideoUpload={(urls) => setVideos((prev) => [...prev, ...urls])}
                onVideoDelete={(url) => setVideos((prev) => prev.filter(u => u !== url))}
              />
            </CardContent>
            <CardFooter className="flex justify-end space-x-4">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => navigate('/admin')}
              >
                Отмена
              </Button>
              <Button 
                type="submit"
                className="bg-optapp-yellow text-optapp-dark hover:bg-yellow-500"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Создание...
                  </>
                ) : (
                  'Создать заказ'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};
