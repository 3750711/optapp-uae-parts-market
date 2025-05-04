
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Loader, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from '@/components/product/ProductCard';
import RequestMatchCount from './RequestMatchCount';
import { ScrollArea } from '@/components/ui/scroll-area';

interface RequestMatchingServiceProps {
  requestId: string;
  requestTitle: string;
  requestBrand?: string;
  requestModel?: string;
}

/**
 * Component that shows matching products for a request
 */
const RequestMatchingService: React.FC<RequestMatchingServiceProps> = ({
  requestId,
  requestTitle,
  requestBrand,
  requestModel
}) => {
  const navigate = useNavigate();
  const [showMatches, setShowMatches] = useState(false);
  
  // Delay showing the component to improve perceived performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMatches(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Fetch matching catalog products with improved exact matching logic
  const { data: catalogMatches = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['catalog-matches', requestTitle, requestBrand, requestModel],
    queryFn: async () => {
      // Only search if we have a title at minimum
      if (!requestTitle) return [];
      
      console.log("Searching catalog for matches with:", {
        title: requestTitle,
        brand: requestBrand,
        model: requestModel
      });
      
      // Get all active products
      let { data: allProducts, error } = await supabase
        .from('products')
        .select('*, product_images(url, is_primary), profiles:seller_id(*)')
        .eq('status', 'active');
      
      if (error) {
        console.error("Error fetching catalog products:", error);
        throw error;
      }
      
      if (!allProducts || allProducts.length === 0) {
        console.log("No active products found in catalog");
        return [];
      }
      
      console.log(`Found total active catalog products: ${allProducts.length || 0}`);
      
      // Prepare the values for comparison - normalize text by trimming and converting to lowercase
      const normalizedTitle = requestTitle?.trim().toLowerCase() || "";
      const normalizedBrand = requestBrand?.trim().toLowerCase() || "";
      const normalizedModel = requestModel?.trim().toLowerCase() || "";
      
      // Filter for exact brand and model matches only
      let matchedProducts = allProducts.filter(product => {
        const productBrand = (product.brand || "").trim().toLowerCase();
        const productModel = (product.model || "").trim().toLowerCase();
        
        // For exact brand and model matching
        const brandMatch = normalizedBrand && productBrand === normalizedBrand;
        const modelMatch = normalizedModel && productModel === normalizedModel;
        
        // Must have exact brand and model match if both are provided
        if (normalizedBrand && normalizedModel) {
          return brandMatch && modelMatch;
        } 
        // If only brand is provided, match on brand
        else if (normalizedBrand) {
          return brandMatch;
        }
        // If only model is provided, match on model
        else if (normalizedModel) {
          return modelMatch;
        }
        // If neither provided, match on title
        else {
          return productBrand.includes(normalizedTitle) || 
                productModel.includes(normalizedTitle) ||
                product.title.toLowerCase().includes(normalizedTitle);
        }
      });
      
      console.log("Found exact matching products:", matchedProducts.length);
      
      // Return top matches, limited to 8 for horizontal display
      return matchedProducts.slice(0, 8);
    },
    enabled: !!requestTitle && showMatches,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Map products to the format expected by ProductCard
  const mappedProducts = catalogMatches.map(product => {
    let imageUrl = "https://images.unsplash.com/photo-1562687877-3c98ca2834c9?q=80&w=500&auto=format&fit=crop";
    if (product.product_images && product.product_images.length > 0) {
      const primaryImage = product.product_images.find(img => img.is_primary);
      if (primaryImage) {
        imageUrl = primaryImage.url;
      } else if (product.product_images[0]) {
        imageUrl = product.product_images[0].url;
      }
    }
    
    const sellerLocation = product.profiles?.location || product.location || "Dubai";
    
    return {
      id: product.id,
      name: product.title,
      price: Number(product.price),
      image: imageUrl,
      condition: product.condition as "Новый" | "Б/У" | "Восстановленный",
      location: sellerLocation,
      seller_opt_id: product.profiles?.opt_id,
      seller_rating: product.profiles?.rating,
      optid_created: product.optid_created,
      rating_seller: product.rating_seller,
      brand: product.brand,
      model: product.model,
      seller_name: product.seller_name,
      status: product.status,
      seller_id: product.seller_id,
      seller_verification: product.profiles?.verification_status,
      seller_opt_status: product.profiles?.opt_status,
      created_at: product.created_at,
      delivery_price: product.delivery_price,
    };
  });

  if (!showMatches) return null;

  return (
    <Card className="border shadow-lg animate-fade-in overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>
      <CardHeader className="space-y-1">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl flex items-center">
            <Sparkles className="mr-3 h-5 w-5 text-amber-500" />
            Предложения по запросу
            {isLoadingCatalog && (
              <Loader className="h-5 w-5 text-amber-500 animate-spin ml-3" />
            )}
          </CardTitle>
          <RequestMatchCount 
            requestTitle={requestTitle}
            requestBrand={requestBrand}
            requestModel={requestModel}
          />
        </div>
        <CardDescription>
          Мы находим для вас лучшие предложения по запрошенной запчасти
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Catalog matches section - single row horizontal layout */}
        {mappedProducts.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium">Точные совпадения</h3>
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                Найдено {mappedProducts.length}
              </Badge>
            </div>

            {/* Horizontal scrollable container */}
            <ScrollArea className="w-full whitespace-nowrap pb-4">
              <div className="flex gap-4 pb-4">
                {mappedProducts.map((product) => (
                  <div key={product.id} className="flex-shrink-0 w-[220px]">
                    <ProductCard {...product} />
                  </div>
                ))}
              </div>
            </ScrollArea>

            {mappedProducts.length > 3 && (
              <div className="text-center mt-4">
                <Button variant="outline" onClick={() => navigate('/catalog')}>
                  Смотреть все предложения в каталоге
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
            <p className="text-muted-foreground">
              Точных совпадений не найдено
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              Вы получите уведомление когда появится подходящее предложение
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RequestMatchingService;
