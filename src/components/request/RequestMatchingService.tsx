
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Loader, Sparkles, Store, User, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import RequestMatchCount from './RequestMatchCount';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminAccess } from '@/hooks/useAdminAccess';

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
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
  
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
      
      // Return top matches
      return matchedProducts.slice(0, 8);
    },
    enabled: !!requestTitle && showMatches,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  // Map products to the format expected by the compact list view
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
      condition: product.condition,
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

  // For demonstration, we'll simulate other sections with placeholder data
  const storeResponses = [
    { id: 1, storeName: "Авто-запчасти Плюс", price: 4500, deliveryDays: 3 },
    { id: 2, storeName: "Авто Мир", price: 5200, deliveryDays: 2 }
  ];

  const specialistResponses = [
    { id: 1, name: "Иван П.", rating: 4.8, comment: "Я подобрал для вас несколько вариантов этой запчасти. Могу предложить аналоги высокого качества." },
    { id: 2, name: "Алексей К.", rating: 4.9, comment: "Есть в наличии оригинальная запчасть. Могу помочь с установкой." }
  ];

  const partsbayResponses = [
    { id: 1, specialist: "Михаил Р.", price: 4800, availability: "В наличии", deliveryTime: "1-2 дня" }
  ];

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
        {/* Block 1: Catalog matches section - compact row layout */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-medium">Точные совпадения</h3>
            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
              Найдено {mappedProducts.length}
            </Badge>
          </div>

          {mappedProducts.length > 0 ? (
            <div className="space-y-2">
              {mappedProducts.map((product) => (
                <div 
                  key={product.id}
                  className="flex items-center p-2 rounded-md border border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  {/* Image */}
                  <div className="h-14 w-14 flex-shrink-0 rounded-md overflow-hidden">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                  
                  {/* Product info */}
                  <div className="ml-3 flex-grow overflow-hidden">
                    <h4 className="font-medium text-sm truncate">{product.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {product.brand} {product.model}
                    </p>
                  </div>
                  
                  {/* Price */}
                  <div className="flex-shrink-0 ml-2">
                    <Badge variant="secondary">{product.price} AED</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                Точных совпадений не найдено
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Вы получите уведомление когда появится подходящее предложение
              </p>
            </div>
          )}

          {mappedProducts.length > 3 && (
            <div className="text-center mt-4">
              <Button variant="outline" onClick={() => navigate('/catalog')}>
                Смотреть все предложения в каталоге
              </Button>
            </div>
          )}
        </div>

        {/* Block 2: Store responses */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Store className="h-5 w-5 text-blue-500" />
            <h3 className="text-lg font-medium">Ответы магазинов</h3>
            <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-700 border-blue-200">
              {storeResponses.length}
            </Badge>
          </div>

          {storeResponses.length > 0 ? (
            <div className="space-y-4">
              {storeResponses.map((store) => (
                <Card key={store.id} className="overflow-hidden border border-blue-100 shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{store.storeName}</h4>
                      <Badge className="bg-blue-500">{store.price} AED</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Срок доставки: {store.deliveryDays} {store.deliveryDays === 1 ? 'день' : store.deliveryDays < 5 ? 'дня' : 'дней'}
                    </p>
                    <Button size="sm" className="mt-2" variant="outline">Связаться</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                Пока нет ответов от магазинов
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Магазины получили ваш запрос и скоро ответят
              </p>
            </div>
          )}
        </div>

        {/* Block 3: Parts specialists */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-green-500" />
            <h3 className="text-lg font-medium">Ответы подборщиков</h3>
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
              {specialistResponses.length}
            </Badge>
          </div>

          {specialistResponses.length > 0 ? (
            <div className="space-y-4">
              {specialistResponses.map((specialist) => (
                <Card key={specialist.id} className="overflow-hidden border border-green-100 shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{specialist.name}</h4>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        ★ {specialist.rating}
                      </Badge>
                    </div>
                    <p className="text-sm mt-1">
                      "{specialist.comment}"
                    </p>
                    <Button size="sm" className="mt-2" variant="outline">Получить предложение</Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                Пока нет ответов от подборщиков
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Специалисты по подбору запчастей скоро предложат вам решения
              </p>
            </div>
          )}
        </div>

        {/* Block 4: PartsBay.ae specialists */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-500" />
            <h3 className="text-lg font-medium">Ответы специалистов partsbay.ae</h3>
            <Badge variant="outline" className="ml-2 bg-purple-50 text-purple-700 border-purple-200">
              {partsbayResponses.length}
            </Badge>
          </div>

          {partsbayResponses.length > 0 ? (
            <div className="space-y-4">
              {partsbayResponses.map((response) => (
                <Card key={response.id} className="overflow-hidden border border-purple-100 shadow-sm">
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">{response.specialist}</h4>
                      <Badge className="bg-purple-500">{response.price} AED</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Наличие</p>
                        <p className="text-sm">{response.availability}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Срок доставки</p>
                        <p className="text-sm">{response.deliveryTime}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button size="sm" variant="default">Заказать</Button>
                      <Button size="sm" variant="outline">Связаться</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed">
              <p className="text-muted-foreground">
                Пока нет ответов от специалистов partsbay.ae
              </p>
              <p className="text-xs text-muted-foreground/70 mt-2">
                Наши специалисты скоро предложат вам оптимальное решение
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RequestMatchingService;
