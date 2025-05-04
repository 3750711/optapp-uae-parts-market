
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
      
      // Filter and score products client-side for more precise matching
      let scoredProducts = allProducts.map(product => {
        const productTitle = (product.title || "").trim().toLowerCase();
        const productBrand = (product.brand || "").trim().toLowerCase();
        const productModel = (product.model || "").trim().toLowerCase();
        
        // Calculate match score for each product
        let score = 0;
        
        // Title match (partial match is acceptable)
        // Both ways check - if product title contains request title OR vice versa
        if (productTitle.includes(normalizedTitle) || normalizedTitle.includes(productTitle)) {
          score += 5;
          if (productTitle === normalizedTitle) {
            score += 5; // Extra points for exact title match
          }
        }
        
        // Brand match with more flexibility
        if (normalizedBrand) {
          // Exact brand match gets highest score
          if (productBrand === normalizedBrand) {
            score += 10;
          }
          // Partial brand matches get lower score (both ways)
          else if (productBrand.includes(normalizedBrand) || normalizedBrand.includes(productBrand)) {
            score += 3;
          } 
          // No brand match significantly reduces the overall score
          else {
            score = Math.max(score - 5, 0);
          }
        }
        
        // Model match with more flexibility
        if (normalizedModel) {
          // Exact model match gets highest score
          if (productModel === normalizedModel) {
            score += 10;
          }
          // Partial model matches get lower score (both ways)
          else if (productModel.includes(normalizedModel) || normalizedModel.includes(productModel)) {
            score += 3;
          }
          // No model match significantly reduces the overall score
          else {
            score = Math.max(score - 5, 0);
          }
        }
        
        return { ...product, matchScore: score };
      });
      
      // Filter out non-matching products (score below minimum threshold) and sort by score
      const minimumScore = 5; // Adjust this threshold as needed
      scoredProducts = scoredProducts.filter(product => product.matchScore >= minimumScore);
      scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log("Found matching products after scoring:", scoredProducts.length);
      console.log("Top matches:", scoredProducts.slice(0, 4).map(p => ({
        title: p.title,
        brand: p.brand,
        model: p.model,
        score: p.matchScore
      })));
      
      // Return top matches
      return scoredProducts.slice(0, 4);
    },
    enabled: !!requestTitle && showMatches,
    // Reduce stale time and add refetch interval to check for new matching products
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
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
      matchScore: product.matchScore
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
      
      <CardContent className="space-y-8">
        {/* Catalog matches section */}
        {mappedProducts.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-medium">Найдено в каталоге</h3>
              <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                {mappedProducts.some(p => p.matchScore >= 20) ? "Точное совпадение" : "Частичное совпадение"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mappedProducts.map((product) => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
            {mappedProducts.length > 2 && (
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
              Ожидайте предложения от продавцов в ближайшее время
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
