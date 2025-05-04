
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
  
  // Fetch matching catalog products with improved matching logic for title, brand, and model
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
      
      // Prepare the values for comparison - normalize text by trimming and converting to lowercase
      const normalizedTitle = request.title.trim().toLowerCase();
      const normalizedBrand = request.brand ? request.brand.trim().toLowerCase() : null;
      const normalizedModel = request.model ? request.model.trim().toLowerCase() : null;
      
      // Get all active products
      let { data, error } = await supabase
        .from('products')
        .select('*, product_images(url, is_primary), profiles:seller_id(*)')
        .eq('status', 'active');
      
      if (error) {
        console.error("Error fetching catalog products:", error);
        throw error;
      }
      
      console.log("Found total active catalog products:", data?.length || 0);
      
      // Filter and score products client-side for more precise matching
      let scoredProducts = data ? data.map(product => {
        const productTitle = (product.title || "").trim().toLowerCase();
        const productBrand = (product.brand || "").trim().toLowerCase();
        const productModel = (product.model || "").trim().toLowerCase();
        
        // Calculate match score for each product
        let score = 0;
        let brandExactMatch = false;
        let modelExactMatch = false;
        
        // Check title match (partial match is acceptable)
        if (productTitle.includes(normalizedTitle) || normalizedTitle.includes(productTitle)) {
          score += 5;
          // Exact title match gets higher score
          if (productTitle === normalizedTitle) {
            score += 5;
          }
        }
        
        // Check brand match - must be exact
        if (normalizedBrand && productBrand) {
          if (productBrand === normalizedBrand) {
            score += 10;
            brandExactMatch = true;
          } else if (productBrand.includes(normalizedBrand) || normalizedBrand.includes(productBrand)) {
            // Partial brand match gets lower score
            score += 3;
          }
        }
        
        // Check model match - must be exact 
        if (normalizedModel && productModel) {
          if (productModel === normalizedModel) {
            score += 10;
            modelExactMatch = true;
          } else if (productModel.includes(normalizedModel) || normalizedModel.includes(productModel)) {
            // Partial model match gets lower score
            score += 3;
          }
        }
        
        // If either brand or model don't match exactly when they exist in the request, 
        // significantly reduce score (but don't eliminate completely)
        if ((normalizedBrand && !brandExactMatch) || (normalizedModel && !modelExactMatch)) {
          score = Math.max(score - 7, 0); // Ensure score doesn't go below 0
        }
        
        return { ...product, matchScore: score };
      }) : [];
      
      // Filter out non-matching products (score 0) and sort by score
      scoredProducts = scoredProducts.filter(product => product.matchScore > 0);
      scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
      
      console.log("Found matching products after scoring:", scoredProducts.length);
      console.log("Top matches:", scoredProducts.slice(0, 4).map(p => ({
        title: p.title,
        brand: p.brand,
        model: p.model,
        score: p.matchScore
      })));
      
      // Return top 4 matches
      return scoredProducts.slice(0, 4);
    },
    enabled: !!request?.title && showResponseOptions,
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
                    {mappedProducts.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-amber-500" />
                          <h3 className="text-lg font-medium">Найдено в каталоге</h3>
                          <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                            Точное совпадение
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
                    )}
                    
                    {/* Show this if no catalog matches and not in pending state */}
                    {mappedProducts.length === 0 && request.status !== 'pending' && (
                      <div className="text-center py-8 bg-muted/20 rounded-lg border border-dashed">
                        <p className="text-muted-foreground">
                          Ожидайте предложения от продавцов в ближайшее время
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
