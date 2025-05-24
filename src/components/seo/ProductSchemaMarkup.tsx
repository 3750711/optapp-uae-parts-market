
import { useEffect } from 'react';
import { ProductProps } from '@/components/product/ProductCard';

interface ProductSchemaMarkupProps {
  products: ProductProps[];
  searchQuery?: string;
  selectedBrandName?: string | null;
  selectedModelName?: string | null;
}

const ProductSchemaMarkup: React.FC<ProductSchemaMarkupProps> = ({
  products,
  searchQuery,
  selectedBrandName,
  selectedModelName
}) => {
  useEffect(() => {
    if (products.length === 0) return;

    // Generate Product schema for each product
    const productSchemas = products.slice(0, 20).map((product, index) => ({
      "@type": "Product",
      "@id": `${window.location.origin}/product/${product.id}`,
      "name": product.title,
      "description": product.description || `${product.brand} ${product.model} автозапчасть`.trim(),
      "brand": {
        "@type": "Brand",
        "name": product.brand || "Неизвестный бренд"
      },
      "model": product.model,
      "image": product.preview_image || product.image || "/placeholder.svg",
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "AED",
        "availability": product.status === 'active' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": product.seller_name || "PartsBay.ae"
        },
        "url": `${window.location.origin}/product/${product.id}`
      },
      "sku": product.id,
      "category": "Автозапчасти",
      "condition": "https://schema.org/UsedCondition"
    }));

    // Create ItemList schema for the catalog page
    const catalogSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": searchQuery ? `Поиск: ${searchQuery}` : "Каталог автозапчастей",
      "description": `Каталог автозапчастей PartsBay.ae${selectedBrandName ? ` - ${selectedBrandName}` : ''}${selectedModelName ? ` ${selectedModelName}` : ''}`,
      "numberOfItems": products.length,
      "url": window.location.href,
      "itemListElement": productSchemas.map((product, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": product
      }))
    };

    // Add or update schema markup
    let script = document.querySelector('script[type="application/ld+json"][data-schema="catalog"]');
    if (!script) {
      script = document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-schema', 'catalog');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(catalogSchema);

    // Cleanup function
    return () => {
      const existingScript = document.querySelector('script[type="application/ld+json"][data-schema="catalog"]');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [products, searchQuery, selectedBrandName, selectedModelName]);

  return null;
};

export default ProductSchemaMarkup;
