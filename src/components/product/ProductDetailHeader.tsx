
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import ProductStatusBadge from "@/components/product/ProductStatusBadge";
import { Product } from "@/types/product";
import { useLanguage } from '@/hooks/useLanguage';
import { getSellerPagesTranslations } from '@/utils/translations/sellerPages';

interface ProductDetailHeaderProps {
  product: Product;
  onBack: () => void;
}

const ProductDetailHeader: React.FC<ProductDetailHeaderProps> = ({
  product,
  onBack,
}) => {
  const { language } = useLanguage();
  const sp = getSellerPagesTranslations(language);

  // Build title with brand and model
  const buildTitle = () => {
    let title = product.title;
    
    if (product.brand && product.model) {
      title = `${title} - ${product.brand} ${product.model}`;
    } else if (product.brand) {
      title = `${title} - ${product.brand}`;
    }
    
    return title;
  };

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
      <div className="flex items-center flex-1">
        <Button variant="ghost" onClick={onBack} className="mr-3 shrink-0">
          <ChevronLeft className="mr-1 h-4 w-4" />
          {sp.back}
        </Button>
        <h1 className="text-xl md:text-3xl font-bold text-foreground truncate">
          {buildTitle()}
        </h1>
      </div>
      
      {/* Status and lot badges */}
      <div className="flex items-center gap-3 shrink-0">
        {product.lot_number && (
          <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium border border-blue-200">
            {sp.lotLabel}: {product.lot_number}
          </div>
        )}
        <ProductStatusBadge status={product.status} size="md" />
      </div>
    </div>
  );
};

export default ProductDetailHeader;
