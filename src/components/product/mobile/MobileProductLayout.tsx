import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Package, User, Truck, Info } from "lucide-react";
import { Product } from "@/types/product";
import ProductGallery from "@/components/product/ProductGallery";
import CompactSellerInfo from "./CompactSellerInfo";
import MobileStickyActions from "./MobileStickyActions";
import { Badge } from "@/components/ui/badge";

interface MobileProductLayoutProps {
  product: Product;
  imageUrls: string[];
  videoUrls: string[];
  selectedImage: string | null;
  onImageClick: (url: string) => void;
  sellerProfile: any;
  sellerName: string;
  deliveryMethod: any;
  onDeliveryMethodChange: (method: any) => void;
  onProductUpdate: () => void;
}

const MobileProductLayout: React.FC<MobileProductLayoutProps> = ({
  product,
  imageUrls,
  videoUrls,
  selectedImage,
  onImageClick,
  sellerProfile,
  sellerName,
  deliveryMethod,
  onDeliveryMethodChange,
  onProductUpdate,
}) => {
  const [activeTab, setActiveTab] = useState("product");

  const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <Badge variant="warning" className="text-xs">Ожидает проверки</Badge>;
      case 'active':
        return <Badge variant="success" className="text-xs">Опубликован</Badge>;
      case 'sold':
        return <Badge variant="info" className="text-xs">Продан</Badge>;
      case 'archived':
        return <Badge variant="outline" className="text-xs bg-gray-100">Архив</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-lg font-bold line-clamp-2 text-foreground">{product.title}</h1>
            {getStatusBadge()}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">{product.price} $</span>
            <div className="text-sm text-muted-foreground">
              {product.product_location || "Dubai"}
            </div>
          </div>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-white">
        <ProductGallery 
          images={imageUrls}
          videos={videoUrls}
          title={product.title}
          selectedImage={selectedImage} 
          onImageClick={onImageClick}
        />
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-50 rounded-none h-12">
            <TabsTrigger value="product" className="flex flex-col items-center gap-1 text-xs">
              <Package className="h-4 w-4" />
              Товар
            </TabsTrigger>
            <TabsTrigger value="seller" className="flex flex-col items-center gap-1 text-xs">
              <User className="h-4 w-4" />
              Продавец
            </TabsTrigger>
            <TabsTrigger value="delivery" className="flex flex-col items-center gap-1 text-xs">
              <Truck className="h-4 w-4" />
              Доставка
            </TabsTrigger>
            <TabsTrigger value="details" className="flex flex-col items-center gap-1 text-xs">
              <Info className="h-4 w-4" />
              Детали
            </TabsTrigger>
          </TabsList>

          {/* Content */}
          <div className="min-h-[60vh]">
            <TabsContent value="product" className="m-0">
              <Card className="rounded-none border-0 shadow-none">
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Описание</h3>
                    <p className="text-sm text-foreground/80 leading-relaxed">
                      {product.description || "Описание отсутствует"}
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Количество мест: {product.place_number || 1}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="seller" className="m-0">
              <CompactSellerInfo 
                sellerProfile={sellerProfile}
                sellerName={sellerName}
                sellerId={product.seller_id}
                productTitle={product.title}
                productId={product.id}
              />
            </TabsContent>

            <TabsContent value="delivery" className="m-0">
              <Card className="rounded-none border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Способ доставки</h3>
                      <div className="text-sm text-muted-foreground">
                        {deliveryMethod === 'cargo_rf' ? 'Карго до РФ' : 
                         deliveryMethod === 'self_pickup' ? 'Самовывоз' : 'Не указано'}
                      </div>
                    </div>
                    
                    {product.delivery_price && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-sm font-medium text-blue-900">
                          Стоимость доставки: {product.delivery_price} $
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="m-0">
              <Card className="rounded-none border-0 shadow-none">
                <CardContent className="p-4 space-y-4">
                  {(product.brand || product.model || product.lot_number) && (
                    <div>
                      <h3 className="font-medium mb-3">Характеристики</h3>
                      <div className="space-y-2">
                        {product.brand && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Бренд:</span>
                            <span className="font-medium">{product.brand}</span>
                          </div>
                        )}
                        {product.model && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Модель:</span>
                            <span className="font-medium">{product.model}</span>
                          </div>
                        )}
                        {product.lot_number && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Лот:</span>
                            <span className="font-medium">{product.lot_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-xs text-muted-foreground">
                      Просмотров: {product.view_count || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Создано: {new Date(product.created_at).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Sticky Actions */}
      <MobileStickyActions 
        product={product}
        sellerProfile={sellerProfile}
        deliveryMethod={deliveryMethod}
        onDeliveryMethodChange={onDeliveryMethodChange}
      />
    </div>
  );
};

export default MobileProductLayout;