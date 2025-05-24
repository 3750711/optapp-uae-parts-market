
import React, { memo } from 'react';
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

const StoreDetailTabs: React.FC<StoreDetailTabsProps> = memo(({
  store,
  carBrandsData,
  sellerProducts,
  isProductsLoading,
  reviews,
  isReviewsLoading
}) => {
  return (
    <div className="animate-fade-in">
      <Tabs defaultValue="about" className="space-y-6">
        {/* Tabs list with enhanced styling */}
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger 
            value="about" 
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 hover:bg-white/50"
          >
            О магазине
          </TabsTrigger>
          <TabsTrigger 
            value="photos"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 hover:bg-white/50"
          >
            Фото {store.store_images?.length ? `(${store.store_images.length})` : ''}
          </TabsTrigger>
          <TabsTrigger 
            value="products"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 hover:bg-white/50"
          >
            Объявления
          </TabsTrigger>
          <TabsTrigger 
            value="reviews"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all duration-200 hover:bg-white/50"
          >
            Отзывы {reviews?.length ? `(${reviews.length})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* Tab content with animations */}
        <TabsContent value="about" className="mt-6">
          <div className="animate-fade-in animation-delay-100">
            <StoreAboutTab 
              description={store.description}
              carBrandsData={carBrandsData}
            />
          </div>
        </TabsContent>

        <TabsContent value="photos" className="mt-6">
          <div className="animate-fade-in animation-delay-100">
            <StorePhotosTab 
              storeImages={store.store_images}
              storeName={store.name}
            />
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-6">
          <div className="animate-fade-in animation-delay-100">
            <StoreProductsTab 
              sellerProducts={sellerProducts}
              isProductsLoading={isProductsLoading}
              sellerId={store.seller_id}
            />
          </div>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <div className="animate-fade-in animation-delay-100">
            <StoreReviewsTab 
              reviews={reviews}
              isReviewsLoading={isReviewsLoading}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

StoreDetailTabs.displayName = 'StoreDetailTabs';

export default StoreDetailTabs;
