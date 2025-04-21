
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout/Layout";
import ProductGrid from "@/components/product/ProductGrid";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";

type Product = Database["public"]["Tables"]["products"]["Row"];

const Catalog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 8;
  const isMobile = useIsMobile();

  const { data: products, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, product_images(url, is_primary), profiles:seller_id(*)")
        .in('status', ['active', 'sold'])
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching products:", error);
        throw new Error("Failed to fetch products");
      }
      return data || [];
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const filteredProducts = products?.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.model.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const totalPages = Math.ceil((filteredProducts.length || 0) / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

  const mappedProducts = paginatedProducts.map(product => {
    let imageUrl = "https://images.unsplash.com/photo-1562687877-3c98ca2834c9?q=80&w=500&auto=format&fit=crop";
    
    if (product.product_images && product.product_images.length > 0) {
      const primaryImage = product.product_images.find(img => img.is_primary);
      if (primaryImage) {
        imageUrl = primaryImage.url;
      } else if (product.product_images[0]) {
        imageUrl = product.product_images[0].url;
      }
    }
    
    return {
      id: product.id,
      name: product.title,
      price: Number(product.price),
      image: imageUrl,
      condition: product.condition as "Новый" | "Б/У" | "Восстановленный",
      location: product.location || "Дубай",
      seller_opt_id: product.profiles?.opt_id,
      seller_rating: product.profiles?.rating,
      optid_created: product.optid_created,
      rating_seller: product.rating_seller,
      brand: product.brand,
      model: product.model,
      seller_name: product.seller_name,
      status: product.status
    };
  });

  return (
    <Layout>
      <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen py-0">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8 flex justify-center">
            <form onSubmit={handleSearch} className="flex w-full max-w-lg items-center space-x-2">
              <Input 
                type="text" 
                placeholder="Поиск по названию..." 
                className="flex-grow border border-gray-300 rounded text-black bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button type="submit" className="bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors duration-300">
                <Search className="h-4 w-4 mr-2" /> Найти
              </Button>
            </form>
          </div>
          
          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-8 w-64 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-gray-100 rounded-lg h-64"></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {!isLoading && filteredProducts.length === 0 && (
            <div className="text-center py-12 animate-fade-in">
              <p className="text-lg text-gray-800">Товары не найдены</p>
              <p className="text-gray-500 mt-2">Попробуйте изменить параметры поиска</p>
            </div>
          )}
          
          {!isLoading && filteredProducts.length > 0 && (
            <div className="animate-fade-in">
              <ProductGrid products={mappedProducts} />
            </div>
          )}
          
          {!isLoading && filteredProducts.length > 0 && (
            <div className="mt-12">
              <Pagination>
                <PaginationContent className={isMobile ? "flex-wrap justify-center gap-2" : ""}>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className={`${currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} transition-transform hover:scale-105`}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={page === currentPage}
                        className={page === currentPage ? "bg-blue-600 text-white border-transparent transition-all duration-300" : "text-gray-700 hover:bg-gray-100 transition-all duration-300"}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className={`${currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} transition-transform hover:scale-105`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Catalog;
