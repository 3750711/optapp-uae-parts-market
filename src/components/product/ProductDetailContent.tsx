
import React from 'react';
import { ProductInfo } from './ProductInfo';
import { ContactButtons } from './ContactButtons';

interface ProductDetailContentProps {
  product: any;
  onUpdate?: () => void;
}

export const ProductDetailContent: React.FC<ProductDetailContentProps> = ({ product, onUpdate }) => {
  return (
    <div className="space-y-6">
      <ProductInfo product={product} onUpdate={onUpdate} />
      <ContactButtons 
        telegram={product.seller?.telegram} 
        phone={product.seller?.phone} 
      />
    </div>
  );
};

export default ProductDetailContent;
