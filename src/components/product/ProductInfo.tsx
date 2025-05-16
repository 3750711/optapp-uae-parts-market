
import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, AlertCircle, Package2, Truck } from "lucide-react";
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
  const { user, profile } = useAuth();
  const { isAdmin } = useAdminAccess();
  const navigate = useNavigate();
  const isOwner = user?.id === product.seller_id;

  const canViewDeliveryPrice = user && profile?.opt_status === 'opt_user';

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
          isCreator={true}
        />
      </div>
    );
  }

  const location = product.product_location || "Dubai";

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <span className="text-muted-foreground flex items-center text-sm">
            <MapPin className="h-4 w-4 mr-1" /> {location}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
      </div>
      
      <h1 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">{product.title}</h1>
      <div className="mb-4 flex items-center gap-2">
        <span className="font-bold text-2xl text-primary">
          {product.price} $
        </span>
        {canViewDeliveryPrice ? (
          product.delivery_price !== null && product.delivery_price !== undefined && product.delivery_price > 0 ? (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Truck className="w-4 h-4 text-gray-500" />
              <span>Доставка: {product.delivery_price} $</span>
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Стоимость доставки не указана
            </div>
          )
        ) : (
          user ? (
            <div className="text-sm text-gray-500">
              Стоимость доставки доступна для OPT пользователей
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              <a href="/login" className="text-blue-500 hover:underline">Авторизуйтесь</a> для просмотра стоимости доставки
            </div>
          )
        )}
      </div>
      
      <div className="mb-6 space-y-4">
        <h3 className="font-medium mb-3 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1.5 text-muted-foreground" />
          Описание:
        </h3>
        <p className="text-foreground/80 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">
          {product.description || "Описание отсутствует"}
        </p>
        <div className="flex items-center text-muted-foreground mt-2">
          <Package2 className="h-4 w-4 mr-1.5" />
          <span>Количество мест для отправки: {product.place_number || 1}</span>
        </div>
      </div>
    </div>
  );
};

export default ProductInfo;
