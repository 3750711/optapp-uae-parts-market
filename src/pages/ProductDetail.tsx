
import React from "react";
import { useParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, MapPin, ShieldCheck, CircleDollarSign } from "lucide-react";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  
  // In a real application, this would fetch product data based on the ID
  const product = {
    id: "1",
    name: "Передний бампер BMW X5 F15 M-Sport",
    price: 2500,
    description: "Оригинальный передний бампер для BMW X5 F15 в стиле M-Sport. Состояние новое, все крепления целые. Подходит для моделей 2013-2018 годов выпуска. В комплекте решетки и заглушки для противотуманных фар.",
    images: [
      "https://images.unsplash.com/photo-1562687877-3c98ca2834c9?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1589134607404-2e72e823d859?q=80&w=800&auto=format&fit=crop"
    ],
    condition: "Новый",
    location: "Дубай",
    brand: "BMW",
    model: "X5 F15",
    year: "2013-2018",
    seller: {
      name: "Авто Детали Премиум",
      rating: 4.8,
      reviews: 124,
      phone: "+971 58 123 4567"
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div>
            <div className="mb-4 overflow-hidden rounded-lg">
              <img 
                src={product.images[0]} 
                alt={product.name}
                className="w-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <div key={index} className="overflow-hidden rounded-md border-2 border-transparent hover:border-optapp-yellow cursor-pointer">
                  <img src={image} alt={`${product.name} ${index + 1}`} className="w-full h-24 object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-optapp-yellow text-optapp-dark">{product.condition}</Badge>
              <span className="text-gray-500 flex items-center">
                <MapPin className="h-4 w-4 mr-1" /> {product.location}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="text-2xl font-bold text-optapp-dark mb-4">
              {product.price} AED
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div className="border rounded p-2">
                  <div className="text-gray-500">Бренд</div>
                  <div className="font-medium">{product.brand}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-gray-500">Модель</div>
                  <div className="font-medium">{product.model}</div>
                </div>
                <div className="border rounded p-2">
                  <div className="text-gray-500">Год</div>
                  <div className="font-medium">{product.year}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium mb-2">Описание:</h3>
                <p className="text-gray-700">{product.description}</p>
              </div>
            </div>
            
            {/* Seller Info & Actions */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-2">Продавец: {product.seller.name}</h3>
              <div className="flex items-center mb-3">
                <div className="text-yellow-500">★★★★★</div>
                <div className="ml-1">
                  {product.seller.rating} ({product.seller.reviews} отзывов)
                </div>
              </div>
              <Button className="w-full bg-optapp-yellow text-optapp-dark hover:bg-yellow-500 mb-2">
                <Phone className="mr-2 h-4 w-4" /> Показать номер
              </Button>
              <Button variant="outline" className="w-full border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white">
                Написать продавцу
              </Button>
            </div>
            
            {/* Additional Info */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-700">
                <ShieldCheck className="h-5 w-5 mr-2 text-optapp-yellow" />
                <span>Безопасная сделка через платформу</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CircleDollarSign className="h-5 w-5 mr-2 text-optapp-yellow" />
                <span>Гарантия возврата денег в течение 14 дней</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProductDetail;
