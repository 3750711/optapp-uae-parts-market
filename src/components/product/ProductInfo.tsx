import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Edit, AlertCircle, Share, Package2 } from "lucide-react";
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

  const handleShare = () => {
    const text = encodeURIComponent(
      `🛍 Товар: ${product.title}\n` +
      `💰 Цена: ${product.price} $\n` +
      `🏷 Бренд: ${product.brand || 'Не указан'}\n` +
      `📝 Модель: ${product.model || 'Не указана'}\n` +
      (product.description ? `📄 Описание:\n${product.description}\n` : '')
    );
    
    const url = encodeURIComponent(window.location.href);
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
  };

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
          isCreator={true}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground flex items-center">
            <MapPin className="h-4 w-4 mr-1" /> {product.location || "Не указано"}
          </span>
          {getStatusBadge()}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-[#229ED9] hover:bg-[#229ED9]/90 text-white border-none"
            onClick={handleShare}
          >
            <Share className="h-4 w-4" />
            Поделиться
          </Button>
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
      <div className="text-2xl font-bold text-primary mb-4 flex items-center">
        {product.price} <span className="ml-1 text-xl">$</span>
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
