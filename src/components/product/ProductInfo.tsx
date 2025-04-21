
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProductEditForm from "./ProductEditForm";
import { Product } from "@/types/product";
import { useAdminAccess } from "@/hooks/useAdminAccess";

interface ProductInfoProps {
  product: Product;
  onProductUpdate: () => void;
}

const ProductInfo: React.FC<ProductInfoProps> = ({ product, onProductUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();
  const { isAdmin } = useAdminAccess();
  const navigate = useNavigate();
  const isOwner = user?.id === product.seller_id;

  const getStatusBadge = () => {
    switch (product.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Ожидает проверки</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Опубликован</Badge>;
      case 'sold':
        return <Badge className="bg-blue-100 text-blue-800">Продан</Badge>;
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Архив</Badge>;
      default:
        return null;
    }
  };

  // Show 404 if product is pending and user is not owner or admin
  if (product.status === 'pending' && !isOwner && !isAdmin) {
    navigate('/404');
    return null;
  }

  const handleSave = () => {
    setIsEditing(false);
    onProductUpdate();
  };

  if (isEditing && isOwner && product.status !== 'sold') {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <ProductEditForm
          product={product}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-optapp-yellow text-optapp-dark">{product.condition}</Badge>
          <span className="text-gray-500 flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> {product.location || "Не указано"}
          </span>
          {getStatusBadge()}
        </div>
        {isOwner && product.status !== 'sold' && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit className="h-4 w-4" />
            Редактировать
          </Button>
        )}
      </div>
      
      <h1 className="text-3xl font-bold mb-2">{product.title}</h1>
      <div className="text-2xl font-bold text-optapp-dark mb-4">
        {product.price} AED
      </div>
      
      {(product.rating_seller !== undefined || product.optid_created) && (
        <div className="flex items-center space-x-4 mb-4">
          {product.optid_created && (
            <div>
              <span className="text-gray-500">OPT ID: </span>
              <span className="font-medium">{product.optid_created}</span>
            </div>
          )}
          {product.rating_seller !== undefined && product.rating_seller !== null && (
            <div className="flex items-center">
              <div className="flex mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating_seller)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm">
                <span className="font-medium">{product.rating_seller.toFixed(1)}</span>
                <span className="text-gray-500"> / 5</span>
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Описание:</h3>
        <p className="text-gray-700">{product.description || "Описание отсутствует"}</p>
      </div>
    </div>
  );
};

export default ProductInfo;
