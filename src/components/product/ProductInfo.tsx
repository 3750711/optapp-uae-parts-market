
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Edit, AlertCircle } from "lucide-react";
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
        return <Badge variant="warning" className="animate-pulse-soft">Ожидает проверки</Badge>;
      case 'active':
        return <Badge variant="success">Опубликован</Badge>;
      case 'sold':
        return <Badge variant="info">Продан</Badge>;
      case 'archived':
        return <Badge variant="outline" className="bg-gray-100">Архив</Badge>;
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
      <div className="bg-white p-6 rounded-xl shadow-card animate-fade-in">
        <ProductEditForm
          product={product}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={product.condition === "Новый" ? "secondary" : "outline"} className={product.condition === "Новый" ? "" : "bg-gray-100"}>
            {product.condition}
          </Badge>
          <span className="text-muted-foreground flex items-center">
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
      
      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">{product.title}</h1>
      <div className="text-2xl font-bold text-primary mb-4 flex items-center">
        {product.price} <span className="ml-1 text-xl">AED</span>
      </div>
      
      {(product.rating_seller !== undefined || product.optid_created) && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6 p-4 rounded-lg bg-gray-50 border border-gray-100">
          {product.optid_created && (
            <div>
              <span className="text-muted-foreground text-sm">OPT ID: </span>
              <span className="font-medium">{product.optid_created}</span>
            </div>
          )}
          {product.rating_seller !== undefined && product.rating_seller !== null && (
            <div className="flex items-center">
              <div className="flex mr-2">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.rating_seller)
                        ? "fill-secondary text-secondary"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm">
                <span className="font-medium">{product.rating_seller.toFixed(1)}</span>
                <span className="text-muted-foreground"> / 5</span>
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-medium mb-3 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1.5 text-muted-foreground" />
          Описание:
        </h3>
        <p className="text-foreground/80 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
          {product.description || "Описание отсутствует"}
        </p>
      </div>
    </div>
  );
};

export default ProductInfo;
