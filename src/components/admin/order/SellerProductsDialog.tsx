

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import OptimizedImage from "@/components/ui/OptimizedImage";

interface Product {
  id: string;
  title: string;
  price: number;
  brand?: string;
  model?: string;
  lot_number: number;
  delivery_price?: number;
  place_number?: number;
  product_images?: { url: string; is_primary?: boolean }[];
  product_videos?: { url: string }[];
}

interface SellerProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string | null;
  sellerName: string;
  onProductSelect: (product: Product) => void;
}

const SellerProductsDialog: React.FC<SellerProductsDialogProps> = ({
  open,
  onOpenChange,
  sellerId,
  sellerName,
  onProductSelect,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (open && sellerId) {
      fetchSellerProducts();
    }
  }, [open, sellerId]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.lot_number.toString().includes(searchTerm)
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const fetchSellerProducts = async () => {
    if (!sellerId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(*), product_videos(*)")
        .eq("seller_id", sellerId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching seller products:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить товары продавца",
          variant: "destructive",
        });
      } else {
        setProducts(data || []);
        setFilteredProducts(data || []);
      }
    } catch (error) {
      console.error("Error fetching seller products:", error);
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при загрузке товаров",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    onProductSelect(product);
    onOpenChange(false);
    setSearchTerm("");
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU').format(price);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-w-[95vw] p-4 sm:p-6 max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-1 pb-3 flex-shrink-0">
          <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
            <Package className="h-5 w-5" />
            Объявления продавца: {sellerName}
          </DialogTitle>
          <DialogDescription className="text-sm">
            Выберите товар для копирования данных в форму заказа
          </DialogDescription>
        </DialogHeader>

        {/* Поиск */}
        <div className="flex-shrink-0 space-y-2">
          <Label htmlFor="search">Поиск по товарам</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Поиск по названию, бренду или номеру лота..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-grow overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Загрузка товаров...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {products.length === 0 
                ? "У данного продавца нет активных товаров"
                : "Товары не найдены по запросу"
              }
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-600 mb-3">
                Найдено товаров: {filteredProducts.length}
              </div>
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-4 cursor-pointer hover:border-primary hover:bg-gray-50 transition-colors"
                  onClick={() => handleProductSelect(product)}
                >
                  <div className="flex items-center gap-4">
                    {/* Фотография товара */}
                    <div className="flex-shrink-0">
                      {product.product_images && product.product_images.length > 0 ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden border">
                          <OptimizedImage
                            src={product.product_images.find(img => img.is_primary)?.url || product.product_images[0]?.url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border bg-gray-100 flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Информация о товаре */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Лот: {product.lot_number}
                        </Badge>
                        {product.product_videos && product.product_videos.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Видео: {product.product_videos.length}
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-medium text-sm mb-1 line-clamp-2">
                        {product.title}
                      </h3>
                      {(product.brand || product.model) && (
                        <p className="text-sm text-gray-600 mb-1">
                          {[product.brand, product.model].filter(Boolean).join(' ')}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {product.delivery_price && (
                          <span>Доставка: ${formatPrice(product.delivery_price)}</span>
                        )}
                        {product.place_number && (
                          <span>Мест: {product.place_number}</span>
                        )}
                      </div>
                    </div>

                    {/* Цена */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-bold text-primary">
                        ${formatPrice(product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default SellerProductsDialog;

