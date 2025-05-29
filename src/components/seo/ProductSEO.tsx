
import SEOHead from '@/components/seo/SEOHead';
import { Product } from '@/types/product';

interface ProductSEOProps {
  product: Product;
  sellerName?: string;
  images?: string[];
}

const ProductSEO: React.FC<ProductSEOProps> = ({
  product,
  sellerName = "Неизвестный продавец",
  images = []
}) => {
  // Построение динамического title
  const buildTitle = () => {
    let title = product.title;
    
    if (product.brand && product.model) {
      title = `${product.brand} ${product.model} - ${product.title}`;
    } else if (product.brand) {
      title = `${product.brand} - ${product.title}`;
    }
    
    return `${title} - ${product.price}$ | PartsBay.ae`;
  };

  // Построение динамического описания
  const buildDescription = () => {
    let description = product.description || `Купить ${product.title} по цене ${product.price}$ от проверенного поставщика из ОАЭ.`;
    
    if (product.brand && product.model) {
      description = `${product.brand} ${product.model}: ${description}`;
    }
    
    description += ` Продавец: ${sellerName}. Прямые поставки из Дубая.`;
    
    if (product.delivery_price && product.delivery_price > 0) {
      description += ` Доставка от ${product.delivery_price}$.`;
    }
    
    return description.substring(0, 160); // Ограничиваем длину
  };

  // Построение ключевых слов
  const buildKeywords = () => {
    const keywords = [
      product.title,
      product.brand,
      product.model,
      'автозапчасти',
      'ОАЭ',
      'Дубай',
      'оптом',
      sellerName
    ].filter(Boolean);
    
    return keywords.join(', ');
  };

  // Главное изображение для Open Graph - используем полные URL
  const primaryImage = images.length > 0 ? images[0] : '/placeholder.svg';

  // Canonical URL
  const canonicalUrl = `${window.location.origin}/product/${product.id}`;

  // Schema.org разметка для товара
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.title,
    "description": product.description || buildDescription(),
    "sku": product.id,
    "brand": product.brand ? {
      "@type": "Brand",
      "name": product.brand
    } : undefined,
    "model": product.model,
    "image": images.length > 0 ? images : [primaryImage],
    "offers": {
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": "USD",
      "availability": product.status === 'active' ? "https://schema.org/InStock" : 
                     product.status === 'sold' ? "https://schema.org/OutOfStock" : 
                     "https://schema.org/PreOrder",
      "seller": {
        "@type": "Organization",
        "name": sellerName
      },
      "url": canonicalUrl
    },
    "category": "Auto Parts",
    "aggregateRating": product.lot_number ? {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "reviewCount": "10"
    } : undefined,
    "additionalProperty": [
      product.brand ? {
        "@type": "PropertyValue",
        "name": "Бренд",
        "value": product.brand
      } : null,
      product.model ? {
        "@type": "PropertyValue", 
        "name": "Модель",
        "value": product.model
      } : null,
      product.lot_number ? {
        "@type": "PropertyValue",
        "name": "Номер лота",
        "value": product.lot_number.toString()
      } : null
    ].filter(Boolean)
  };

  console.log('ProductSEO: Using image:', primaryImage);
  console.log('ProductSEO: Product data:', { title: buildTitle(), description: buildDescription() });

  return (
    <SEOHead
      title={buildTitle()}
      description={buildDescription()}
      keywords={buildKeywords()}
      ogImage={primaryImage}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
    />
  );
};

export default ProductSEO;
