import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';
import { getCommonTranslations } from '@/utils/translations/common';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Package, UserCheck, ShoppingCart, ChevronLeft, Eye } from "lucide-react";
import OrderConfirmationStep from "@/components/admin/sell-product/OrderConfirmationStep";
import { useNavigate } from "react-router-dom";
import { OrderConfirmEvidenceWizard } from "@/components/admin/OrderConfirmEvidenceWizard";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

// New optimized components
import OptimizedProductCard from "@/components/seller/OptimizedProductCard";
import EnhancedProductSearch, { SearchFilters } from "@/components/seller/EnhancedProductSearch";
import ProductBreadcrumbs from "@/components/seller/ProductBreadcrumbs";
import { ProductGridSkeleton, StepSkeleton } from "@/components/ui/SkeletonLoader";
import ProductQuickPreview from "@/components/seller/ProductQuickPreview";
import MobileProductCard from "@/components/seller/MobileProductCard";
import KeyboardShortcuts from "@/components/seller/KeyboardShortcuts";
import { Product } from "@/types/product";

interface BuyerProfile {
  id: string;
  full_name: string;
  opt_id: string;
  telegram?: string;
}

const SellerSellProduct = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isMobile = useIsMobile();
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);
  const c = getCommonTranslations(language);
  
  // State management
  const [step, setStep] = useState(1);
  const [buyers, setBuyers] = useState<BuyerProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  
  const [showConfirmImagesDialog, setShowConfirmImagesDialog] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  
  // New states for improved UX
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [searchInputRef, setSearchInputRef] = useState<HTMLInputElement | null>(null);

  // Memoized breadcrumbs
  const breadcrumbItems = useMemo(() => [
    { label: sp.sellProductTitle }
  ], [sp.sellProductTitle]);

  // Check that user is a seller
  useEffect(() => {
    if (profile && profile.user_type !== 'seller') {
      toast({
        title: sp.accessError,
        description: sp.onlyForSellers,
        variant: "destructive",
      });
      navigate('/');
      return;
    }
  }, [profile, navigate]);

  // Load buyers with error handling
  useEffect(() => {
    const fetchBuyers = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, opt_id, telegram")
          .eq("user_type", "buyer")
          .not("opt_id", "is", null)
          .order("full_name");

        if (error) throw error;
        setBuyers(data || []);
      } catch (error) {
        console.error("Error fetching buyers:", error);
        toast({
          title: sp.error,
          description: sp.failedToLoadBuyers,
          variant: "destructive",
        });
      }
    };

    fetchBuyers();
  }, []);

  // Load products with error handling and cleanup
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*, product_images(*)")
          .eq("seller_id", user.id)
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;
        
        if (isMounted) {
          setProducts(data || []);
          setFilteredProducts(data || []);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && isMounted) {
          console.error("Error fetching products:", error);
          toast({
            title: sp.error,
            description: sp.failedToLoadProducts,
            variant: "destructive",
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [user]);

  // Optimized search function with memoization
  const handleSearchChange = useCallback((filters: SearchFilters) => {
    let filtered = [...products];

    // Filter by title
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower) ||
        product.model?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by lot number
    if (filters.lotNumber.trim()) {
      filtered = filtered.filter(product =>
        product.lot_number?.toString().includes(filters.lotNumber)
      );
    }

    // Filter by price
    if (filters.priceFrom.trim()) {
      const priceFrom = parseFloat(filters.priceFrom);
      if (!isNaN(priceFrom)) {
        filtered = filtered.filter(product => product.price >= priceFrom);
      }
    }

    if (filters.priceTo.trim()) {
      const priceTo = parseFloat(filters.priceTo);
      if (!isNaN(priceTo)) {
        filtered = filtered.filter(product => product.price <= priceTo);
      }
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (filters.sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'lot_number':
          aValue = a.lot_number || 0;
          bValue = b.lot_number || 0;
          break;
        default:
          return 0;
      }
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  }, [products]);

  const handleClearFilters = useCallback(() => {
    setFilteredProducts(products);
  }, [products]);

  const handleProductSelect = useCallback((product: Product) => {
    setSelectedProduct(product);
    setStep(2);
  }, []);

  const handleProductPreview = useCallback((product: Product) => {
    setPreviewProduct(product);
    setShowPreview(true);
  }, []);

  const handleBuyerSelect = useCallback((buyerId: string) => {
    const buyer = buyers.find(b => b.id === buyerId);
    setSelectedBuyer(buyer || null);
    setStep(3);
  }, [buyers]);

  // Keyboard shortcuts handlers
  const handleKeyboardCancel = useCallback(() => {
    if (showPreview) {
      setShowPreview(false);
    } else if (step > 1) {
      setStep(step - 1);
    } else {
      navigate('/seller/dashboard');
    }
  }, [showPreview, step, navigate]);

  const handleKeyboardSearch = useCallback(() => {
    if (searchInputRef) {
      searchInputRef.focus();
    }
  }, [searchInputRef]);

  const createOrder = async (orderData: {
    price: number;
    deliveryPrice?: number;
    deliveryMethod: string;
    orderImages: string[];
    editedData?: {
      title?: string;
      brand?: string;
      model?: string;
      price?: number;
      deliveryPrice?: number;
      placeNumber?: number;
      textOrder?: string;
    };
  }) => {
    if (!selectedProduct || !selectedBuyer || !profile) {
      toast({
        title: sp.error,
        description: sp.notAllDataFilled,
        variant: "destructive",
      });
      return;
    }

    console.log("Creating order with data:", {
      seller: profile,
      product: selectedProduct,
      buyer: selectedBuyer,
      orderData
    });

    setIsCreatingOrder(true);

    try {
      // Validate delivery_method
      const validDeliveryMethods = ['cargo_rf', 'cargo_kz', 'self_pickup'];
      if (!validDeliveryMethods.includes(orderData.deliveryMethod)) {
        throw new Error(`Invalid delivery method: ${orderData.deliveryMethod}`);
      }

      // Use RPC function for creating orders by sellers
      const orderPayload = {
        p_title: orderData.editedData?.title || selectedProduct.title,
        p_price: orderData.price,
        p_place_number: orderData.editedData?.placeNumber || selectedProduct.place_number || 1,
        p_order_seller_name: profile.full_name || '',
        p_buyer_id: selectedBuyer.id,
        p_brand: orderData.editedData?.brand || selectedProduct.brand || '',
        p_model: orderData.editedData?.model || selectedProduct.model || '',
        p_status: 'seller_confirmed' as const,
        p_order_created_type: 'product_order' as const,
        p_telegram_url_order: selectedBuyer.telegram || '',
        p_images: orderData.orderImages,
        p_videos: [], // ADDED: empty video array for product orders
        p_product_id: selectedProduct.id,
        p_delivery_method: orderData.deliveryMethod as 'cargo_rf' | 'cargo_kz' | 'self_pickup',
        p_text_order: orderData.editedData?.textOrder || '',
        p_delivery_price_confirm: orderData.deliveryPrice || null
      };

      console.log("RPC payload:", orderPayload);

      const { data: orderId, error: orderError } = await supabase
        .rpc('seller_create_order', orderPayload);

      if (orderError) {
        console.error("Error creating order:", orderError);
        throw orderError;
      }

      console.log("Order created with ID:", orderId);
      setCreatedOrderId(orderId);

      // Get created order data for Telegram notification
      const { data: createdOrder, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (fetchError) {
        console.error("Error fetching created order:", fetchError);
      }

      // Notifications will be sent automatically via database triggers
      console.log("Order created, notifications will be sent via database triggers");

      toast({
        title: sp.orderCreated,
        description: "Order successfully created",
      });

      // Open photo upload dialog
      setShowConfirmImagesDialog(true);

    } catch (error) {
      console.error("Error creating order:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: sp.orderCreationError,
        description: `Details: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handleConfirmImagesComplete = () => {
    // Close photo upload dialog and navigate to seller orders page
    setShowConfirmImagesDialog(false);
    if (createdOrderId) {
      navigate(`/order/${createdOrderId}`);
    } else {
      navigate('/seller/orders');
    }
  };

  const handleSkipConfirmImages = () => {
    // Skip photo upload and navigate to seller orders page
    setShowConfirmImagesDialog(false);
    if (createdOrderId) {
      navigate(`/order/${createdOrderId}`);
    } else {
      navigate('/seller/orders');
    }
  };

  const handleCancelConfirmImages = () => {
    // Simply close dialog without navigation
    setShowConfirmImagesDialog(false);
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setSelectedBuyer(null);
    setStep(1);
    setShowConfirmImagesDialog(false);
    setCreatedOrderId(null);
  };

  const getStepIcon = (stepNumber: number) => {
    switch (stepNumber) {
      case 1: return <Package className="h-4 w-4" />;
      case 2: return <UserCheck className="h-4 w-4" />;
      case 3: return <ShoppingCart className="h-4 w-4" />;
      default: return null;
    }
  };

  const handleGoBack = () => {
    navigate('/seller/dashboard');
  };

  if (!profile || profile.user_type !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Keyboard shortcuts */}
      <KeyboardShortcuts
        onCancel={handleKeyboardCancel}
        onSearch={handleKeyboardSearch}
        disabled={isCreatingOrder || showConfirmImagesDialog}
      />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Breadcrumbs */}
        <ProductBreadcrumbs items={breadcrumbItems} />

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="mr-4" 
              onClick={handleGoBack}
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> {c.buttons.back}
            </Button>
            <h1 className="text-3xl font-bold">{sp.sellProductTitle}</h1>
          </div>
          <p className="text-gray-600 mt-2">
            {sp.selectProductAndBuyer}
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {[
              { num: 1, title: sp.selectProduct, completed: step > 1 },
              { num: 2, title: sp.selectBuyer, completed: step > 2 },
              { num: 3, title: sp.confirmation, completed: false }
            ].map((stepItem, index) => (
              <React.Fragment key={stepItem.num}>
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step === stepItem.num 
                      ? 'border-primary bg-primary text-white' 
                      : stepItem.completed 
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 text-gray-500'
                  }`}>
                    {getStepIcon(stepItem.num)}
                  </div>
                  <span className={`text-sm font-medium ${
                    step === stepItem.num ? 'text-primary' : stepItem.completed ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {stepItem.title}
                  </span>
                </div>
                {index < 2 && <ChevronRight className="h-4 w-4 text-gray-400" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Select Product with enhanced search */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>{sp.step1Title}</CardTitle>
              <CardDescription>
                {sp.step1Description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Enhanced search component */}
              <EnhancedProductSearch
                onSearchChange={handleSearchChange}
                onClearFilters={handleClearFilters}
                totalProducts={products.length}
                filteredCount={filteredProducts.length}
              />
              
              {isLoading ? (
                <ProductGridSkeleton count={6} />
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {products.length === 0 
                      ? sp.noProductsInInventory
                      : sp.noProductsFound
                    }
                  </h3>
                  <p className="text-gray-500">
                    {products.length === 0 
                      ? sp.addProductsFirst
                      : sp.tryChangingSearchCriteria
                    }
                  </p>
                </div>
              ) : (
                <div className={isMobile ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "space-y-3"}>
                  {filteredProducts.map((product) => (
                    isMobile ? (
                      <MobileProductCard
                        key={product.id}
                        product={product}
                        onSelect={handleProductSelect}
                        onPreview={handleProductPreview}
                      />
                    ) : (
                      <OptimizedProductCard
                        key={product.id}
                        product={product}
                        onSelect={handleProductSelect}
                      />
                    )
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Select Buyer */}
        {step === 2 && selectedProduct && (
          <Card>
            <CardHeader>
              <CardTitle>{sp.step2Title}</CardTitle>
              <CardDescription>
                {sp.productLabel} {selectedProduct.title}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="buyer">{sp.selectBuyer}</Label>
                <Select onValueChange={handleBuyerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={sp.selectBuyerPlaceholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {buyers
                      .sort((a, b) => (a.opt_id || '').localeCompare(b.opt_id || ''))
                      .map((buyer) => (
                        <SelectItem key={buyer.id} value={buyer.id}>
                          {buyer.opt_id} - {buyer.full_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-6 flex space-x-2">
                 <Button variant="outline" onClick={() => setStep(1)}>
                   {c.buttons.back}
                 </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Order Confirmation */}
        {step === 3 && selectedProduct && selectedBuyer && profile && (
          <OrderConfirmationStep
            product={selectedProduct}
            seller={{
              id: profile.id,
              full_name: profile.full_name || '',
              opt_id: profile.opt_id || '',
              telegram: profile.telegram
            }}
            buyer={selectedBuyer}
            onConfirm={createOrder}
            onBack={() => setStep(2)}
            isSubmitting={isCreatingOrder}
          />
        )}

        {/* Product Preview Dialog */}
        <ProductQuickPreview
          product={previewProduct}
          open={showPreview}
          onOpenChange={setShowPreview}
          onSelectProduct={handleProductSelect}
        />


        {/* Confirmation Images Upload Dialog */}
        {showConfirmImagesDialog && createdOrderId && (
        <OrderConfirmEvidenceWizard
          open={showConfirmImagesDialog}
          orderId={createdOrderId}
          onComplete={handleConfirmImagesComplete}
          onCancel={handleCancelConfirmImages}
        />
        )}
      </div>
    </div>
  );
};

export default SellerSellProduct;
