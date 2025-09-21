import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import WriteReviewDialog from '@/components/store/WriteReviewDialog';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import StoreSEO from '@/components/store/StoreSEO';
import StoreBreadcrumb from '@/components/store/StoreBreadcrumb';
import StoreImageGallery from '@/components/store/StoreImageGallery';
import StoreHeader from '@/components/store/StoreHeader';
import StoreDetailTabs from '@/components/store/StoreDetailTabs';
import StoreSidebar from '@/components/store/StoreSidebar';
import { useStoreData } from '@/hooks/useStoreData';


const StoreDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const {
    store,
    isStoreLoading,
    refetch,
    carBrandsData,
    sellerProducts,
    isProductsLoading,
    reviews,
    isReviewsLoading,
    productCount,
    isCountLoading,
    soldProductCount,
    isSoldCountLoading
  } = useStoreData(id || '');

  const onReviewSubmitted = () => {
    refetch();
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleGoToLogin = () => {
    setShowAuthDialog(false);
    navigate('/login');
  };

  const handleAuthDialogClose = () => {
    setShowAuthDialog(false);
  };

  // Share functionality
  const handleShareStore = async () => {
    const url = window.location.href;
    const storeName = store?.name || 'магазин';
    const shareData = {
      title: `${storeName} - Автозапчасти OPT`,
      text: `Посмотрите этот магазин автозапчастей: ${storeName}`,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на магазин скопирована в буфер обмена"
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  const handleShareToTelegram = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Посмотрите этот магазин автозапчастей: ${store?.name || "магазин"}`);
    
    const telegramUrl = `https://t.me/share/url?url=${url}&text=${text}`;
    window.open(telegramUrl, '_blank');
  };
  
  const reviewsCount = reviews?.length || 0;
  const averageRating = reviewsCount > 0 
    ? reviews!.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsCount 
    : null;

  const handleWriteReview = () => {
    if (user) setIsReviewDialogOpen(true);
    else setShowAuthDialog(true);
  };

  // Check if current user is the store owner
  const isStoreOwner = user?.id === store?.seller_id;

  // Normalized contacts for mobile quick actions
  const normalizedPhone = store?.phone ? store.phone.toString().replace(/[^\d+]/g, "") : null;
  const normalizedWhatsapp = (store as any)?.whatsapp ? (store as any).whatsapp.toString().replace(/\D/g, "") : null;

  if (isStoreLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-6 w-64 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Skeleton className="h-96 w-full md:col-span-2" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!store) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Магазин не найден</h1>
            <p className="text-muted-foreground">Запрошенный магазин не существует или был удалён</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* SEO component */}
      <StoreSEO 
        store={store} 
        reviewsCount={reviewsCount} 
        averageRating={averageRating ?? undefined} 
      />

      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumbs - desktop only */}
        <div className="hidden md:block">
          <StoreBreadcrumb 
            storeName={store.name} 
            storeLocation={store.location || undefined} 
          />
        </div>

        {/* Back button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            className="flex items-center gap-2" 
            onClick={handleGoBack}
          >
            <ChevronLeft className="h-5 w-5" />
            Назад
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left column content */}
          <div className="md:col-span-2 space-y-6 order-2 md:order-1">
            {/* Store header */}
            <StoreHeader 
              store={store}
              averageRating={averageRating ?? undefined}
              reviewsCount={reviewsCount}
              onShareStore={handleShareStore}
              onShareToTelegram={handleShareToTelegram}
              showShareButton={isStoreOwner}
            />

            {/* Mobile quick actions */}
            {(normalizedPhone || normalizedWhatsapp) && (
              <div className="md:hidden grid grid-cols-2 gap-3">
                {normalizedPhone && (
                  <Button
                    variant="default"
                    className="h-11"
                    onClick={() => (window.location.href = `tel:${normalizedPhone}`)}
                    aria-label="Позвонить"
                  >
                    Позвонить
                  </Button>
                )}
                {normalizedWhatsapp && (
                  <Button
                    variant="secondary"
                    className="h-11"
                    onClick={() => window.open(`https://wa.me/${normalizedWhatsapp}`, "_blank", "noopener,noreferrer")}
                    aria-label="Написать в WhatsApp"
                  >
                    WhatsApp
                  </Button>
                )}
              </div>
            )}

            {/* Tabs */}
            <StoreDetailTabs 
              store={store}
              carBrandsData={carBrandsData}
              sellerProducts={sellerProducts}
              isProductsLoading={isProductsLoading}
              reviews={reviews}
              isReviewsLoading={isReviewsLoading}
              onWriteReview={handleWriteReview}
            />
          </div>

          {/* Right column - Store image gallery and info */}
          <div className="space-y-6 order-1 md:order-2">
            {/* Image gallery */}
            <StoreImageGallery 
              images={store.store_images || []}
              storeName={store.name}
            />

            {/* Store sidebar - desktop only */}
            <div className="hidden md:block">
              <StoreSidebar 
                store={store}
                carBrandsData={carBrandsData}
                productCount={productCount}
                soldProductCount={soldProductCount}
                reviewsCount={reviews?.length || 0}
                isCountLoading={isCountLoading}
                isSoldCountLoading={isSoldCountLoading}
              />
            </div>
          </div>
        </div>
      </div>

      <WriteReviewDialog 
        open={isReviewDialogOpen} 
        onOpenChange={setIsReviewDialogOpen} 
        storeId={store?.id || ''}
        onSubmitted={onReviewSubmitted}
      />

      {/* Authentication Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={handleAuthDialogClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Требуется авторизация</DialogTitle>
            <DialogDescription>
              Для использования этой функции необходимо войти в аккаунт или зарегистрироваться.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-center">
            <Button onClick={handleGoToLogin} className="w-full sm:w-auto">
              Войти / Зарегистрироваться
            </Button>
            <Button variant="outline" onClick={handleAuthDialogClose} className="w-full sm:w-auto">
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default StoreDetail;
