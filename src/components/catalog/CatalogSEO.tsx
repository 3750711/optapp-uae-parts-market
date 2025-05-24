
import SEOHead from '@/components/seo/SEOHead';
import ProductSchemaMarkup from '@/components/seo/ProductSchemaMarkup';
import { ProductProps } from '@/components/product/ProductCard';

interface CatalogSEOProps {
  searchQuery?: string;
  selectedBrandName?: string | null;
  selectedModelName?: string | null;
  totalProducts?: number;
  products?: ProductProps[];
}

const CatalogSEO: React.FC<CatalogSEOProps> = ({
  searchQuery,
  selectedBrandName,
  selectedModelName,
  totalProducts = 0,
  products = []
}) => {
  // Построение динамического title
  const buildTitle = () => {
    let title = "Каталог автозапчастей";
    
    if (selectedBrandName && selectedModelName) {
      title = `Запчасти ${selectedBrandName} ${selectedModelName}`;
    } else if (selectedBrandName) {
      title = `Запчасти ${selectedBrandName}`;
    } else if (searchQuery) {
      title = `Поиск: ${searchQuery}`;
    }
    
    return `${title} - PartsBay.ae | Оптом из ОАЭ`;
  };

  // Построение динамического описания
  const buildDescription = () => {
    let description = "Найдите автозапчасти оптом от проверенных поставщиков из ОАЭ.";
    
    if (selectedBrandName && selectedModelName) {
      description = `Запчасти для ${selectedBrandName} ${selectedModelName} оптом из ОАЭ. Прямые поставки, конкурентные цены.`;
    } else if (selectedBrandName) {
      description = `Автозапчасти ${selectedBrandName} оптом из ОАЭ. Широкий выбор оригинальных и аналоговых деталей.`;
    } else if (searchQuery) {
      description = `Результаты поиска "${searchQuery}" в каталоге автозапчастей PartsBay.ae.`;
    }
    
    if (totalProducts > 0) {
      description += ` Найдено товаров: ${totalProducts}.`;
    }
    
    return description;
  };

  // Построение ключевых слов
  const buildKeywords = () => {
    let keywords = "автозапчасти оптом, ОАЭ, Дубай, запчасти";
    
    if (selectedBrandName) {
      keywords += `, ${selectedBrandName}`;
    }
    
    if (selectedModelName) {
      keywords += `, ${selectedModelName}`;
    }
    
    if (searchQuery) {
      keywords += `, ${searchQuery}`;
    }
    
    return keywords;
  };

  // Structured Data для каталога
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": buildTitle(),
    "description": buildDescription(),
    "url": window.location.href,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": totalProducts,
      "itemListElement": []
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Главная",
          "item": "https://partsbay.ae"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Каталог",
          "item": "https://partsbay.ae/catalog"
        }
      ]
    }
  };

  // Добавляем бренд в breadcrumbs если выбран
  if (selectedBrandName) {
    structuredData.breadcrumb.itemListElement.push({
      "@type": "ListItem",
      "position": 3,
      "name": selectedBrandName,
      "item": `https://partsbay.ae/catalog?brand=${selectedBrandName}`
    });
  }

  return (
    <>
      <SEOHead
        title={buildTitle()}
        description={buildDescription()}
        keywords={buildKeywords()}
        canonicalUrl={window.location.href}
        structuredData={structuredData}
      />
      
      {/* Add product schema markup for Rich Snippets */}
      <ProductSchemaMarkup
        products={products}
        searchQuery={searchQuery}
        selectedBrandName={selectedBrandName}
        selectedModelName={selectedModelName}
      />
    </>
  );
};

export default CatalogSEO;
