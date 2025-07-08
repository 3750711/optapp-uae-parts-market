import React from "react";
import { Button } from "@/components/ui/button";
import { Heart, Share2, Eye } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "@/hooks/use-toast";

interface ProductActionsProps {
  productId: string;
  productTitle: string;
  viewCount?: number;
}

const ProductActions: React.FC<ProductActionsProps> = ({
  productId,
  productTitle,
  viewCount = 0
}) => {
  const { isFavorite, toggleFavorite, isUpdating } = useFavorites();

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          url: url,
        });
      } catch (error) {
        // Fallback to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на товар скопирована в буфер обмена",
        });
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: "Ссылка скопирована",
          description: "Ссылка на товар скопирована в буфер обмена",
        });
      } catch (error) {
        toast({
          title: "Ошибка",
          description: "Не удалось скопировать ссылку",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100">
      {/* Favorite button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => toggleFavorite(productId)}
        disabled={isUpdating}
        className={`flex items-center gap-2 ${
          isFavorite(productId) 
            ? 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100' 
            : 'hover:text-red-600 hover:border-red-200'
        }`}
      >
        <Heart 
          className={`h-4 w-4 ${isFavorite(productId) ? 'fill-current' : ''}`} 
        />
        {isFavorite(productId) ? 'В избранном' : 'В избранное'}
      </Button>

      {/* Share button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Поделиться
      </Button>

      {/* View count */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
        <Eye className="h-4 w-4" />
        <span>{viewCount.toLocaleString()} просмотров</span>
      </div>
    </div>
  );
};

export default ProductActions;