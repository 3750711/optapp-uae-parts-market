
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StoreAboutTab from './StoreAboutTab';
import StorePhotosTab from './StorePhotosTab';
import StoreProductsTab from './StoreProductsTab';
import StoreReviewsTab from './StoreReviewsTab';
import { StoreWithImages, StoreReview } from '@/types/store';

interface CarBrand {
  id: string;
  name: string;
  models: Array<{ id: string; name: string }>;
}

interface Product {
  id: string;
  title: string;
  price: number;
  created_at: string;
  status: string;
}

interface StoreDetailTabsProps {
  store: StoreWithImages;
  carBrandsData?: CarBrand[];
  sellerProducts?: Product[];
  isProductsLoading: boolean;
  reviews?: StoreReview[];
  isReviewsLoading: boolean;
}

const StoreDetailTabs: React.FC<StoreDetailTabsProps> = ({
  store,
  carBrandsData,
  sellerProducts,
  isProductsLoading,
  reviews,
  isReviewsLoading
}) => {
  return (
    <Tabs defaultValue="about" className="space-y-4">
      {/* Tabs list */}
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="about">О магазине</TabsTrigger>
        <TabsTrigger value="photos">Фото</TabsTrigger>
        <TabsTrigger value="products">Объявления</TabsTrigger>
        <TabsTrigger value="reviews">Отзывы</TabsTrigger>
      </TabsList>

      {/* About tab */}
      <TabsContent value="about">
        <StoreAboutTab 
          description={store.description}
          carBrandsData={carBrandsData}
        />
      </TabsContent>

      {/* Photos tab */}
      <TabsContent value="photos">
        <StorePhotosTab 
          storeImages={store.store_images}
          storeName={store.name}
        />
      </TabsContent>

      {/* Products tab */}
      <TabsContent value="products">
        <StoreProductsTab 
          sellerProducts={sellerProducts}
          isProductsLoading={isProductsLoading}
          sellerId={store.seller_id}
        />
      </TabsContent>

      {/* Reviews tab */}
      <TabsContent value="reviews">
        <StoreReviewsTab 
          reviews={reviews}
          isReviewsLoading={isReviewsLoading}
        />
      </TabsContent>
    </Tabs>
  );
};

export default StoreDetailTabs;
