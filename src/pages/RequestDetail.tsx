import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, Tag, FileText, Check, MessageSquare, Send, Sparkles, Loader, Database } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import RequestProcessing from '@/components/request/RequestProcessing';
import { Progress } from "@/components/ui/progress";
import ProductCard from '@/components/product/ProductCard';
import ProductGrid from '@/components/product/ProductGrid';
import RequestStatusBadge from '@/components/request/RequestStatusBadge';
import RequestMatchingService from '@/components/request/RequestMatchingService';

const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showResponseOptions, setShowResponseOptions] = useState(false);
  
  // Fetch request details
  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      setDataLoaded(true);
      
      // After data is loaded, show response options after a delay
      setTimeout(() => {
        setShowResponseOptions(true);
      }, 2000);
      
      return data;
    },
    enabled: !!id
  });
  
  // Fetch matching catalog products with improved exact matching logic
  const { data: catalogMatches = [], isLoading: isLoadingCatalog } = useQuery({
    queryKey: ['catalog-matches', request?.title, request?.brand, request?.model],
    queryFn: async () => {
      // Only search if we have a title at minimum
      if (!request?.title) return [];
      
      console.log("Searching catalog for matches with:", {
        title: request.title,
        brand: request.brand,
        model: request.model
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
      const normalizedTitle = request.title?.trim().toLowerCase() || "";
      const normalizedBrand = request.brand?.trim().toLowerCase() || "";
      const normalizedModel = request.model?.trim().toLowerCase() || "";
      
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
    enabled: !!request?.title && showResponseOptions,
    // Crucial: reduce stale time and add refetch interval to check for new matching products periodically
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute to check for new matches
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
  
  if (isLoading || !dataLoaded) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-2/3 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!request) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Запрос не найден</CardTitle>
              <CardDescription>Запрашиваемая информация не существует или была удалена</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Always show the request processing component */}
          <RequestProcessing requestId={id || ''} requestTitle={request.title} />
          
          {/* Add the real-time matching service */}
          <RequestMatchingService 
            requestId={id || ''} 
            requestTitle={request.title}
            requestBrand={request.brand}
            requestModel={request.model}
          />
          
          {showResponseOptions && (
            <Card className="border shadow-lg animate-fade-in overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400"></div>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl flex items-center">
                  <Sparkles className="mr-3 h-5 w-5 text-amber-500" />
                  Предложения по запросу
                  {request.status === 'pending' && (
                    <Loader className="h-5 w-5 text-amber-500 animate-spin ml-3" />
                  )}
                </CardTitle>
                <CardDescription>
                  Мы находим для вас лучшие предложения по запрошенной запчасти
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {request.status === 'pending' ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      В настоящее время мы ищем для вас лучшие предложения
                    </p>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Original request details card */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl mb-2">{request.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <CalendarClock className="w-4 h-4 mr-2" />
                    {new Date(request.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <RequestStatusBadge status={request.status} />
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {(request.brand || request.model) && (
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  <span className="font-medium">
                    {request.brand} {request.model && `${request.model}`}
                  </span>
                </div>
              )}
              
              {request.vin && (
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">VIN: {request.vin}</span>
                </div>
              )}
              
              {request.description && (
                <div className="mt-4">
                  <h3 className="font-medium mb-1">Дополнительная информация:</h3>
                  <div className="whitespace-pre-wrap">{request.description}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default RequestDetail;
