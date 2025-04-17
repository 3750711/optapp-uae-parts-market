
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import SellerDashboard from "@/components/seller/SellerDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SellerProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Use type assertion to bypass TypeScript errors
        const { data: productsData, error: productsError } = await (supabase
          .from('products') as any)
          .select('*, product_images(url, is_primary)')
          .eq('seller_id', user.id)
          .order('created_at', { ascending: false });
        
        if (productsError) throw productsError;
        setProducts(productsData || []);
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <SellerDashboard />
        
        {/* Recent Products */}
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-4">Ваши товары</h3>
          
          <div className="bg-white rounded-lg shadow p-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Загрузка...</p>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-square relative bg-gray-100">
                      {product.product_images && product.product_images.length > 0 ? (
                        <img 
                          src={product.product_images.find((img: any) => img.is_primary)?.url || product.product_images[0].url} 
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Нет фото
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                        <p className="font-medium">{product.title}</p>
                        <p>{product.price} AED</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">У вас пока нет товаров</p>
                <button 
                  className="mt-4 bg-optapp-yellow text-optapp-dark px-4 py-2 rounded font-medium hover:bg-yellow-500"
                  onClick={() => navigate('/seller/add-product')}
                >
                  Добавить первый товар
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Orders */}
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-4">Недавние заказы</h3>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center py-8">
              <p className="text-gray-500">У вас пока нет заказов</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerProfile;
