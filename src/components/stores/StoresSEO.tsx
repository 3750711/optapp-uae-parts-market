
import SEOHead from '@/components/seo/SEOHead';

interface StoresSEOProps {
  totalCount: number;
  searchQuery?: string;
}

const StoresSEO: React.FC<StoresSEOProps> = ({
  totalCount,
  searchQuery
}) => {
  // Построение динамического title
  const buildTitle = () => {
    if (searchQuery) {
      return `Поиск "${searchQuery}" - ${totalCount} магазинов автозапчастей | PartsBay.ae`;
    }
    return `${totalCount} магазинов автозапчастей в ОАЭ | PartsBay.ae`;
  };

  // Построение динамического описания
  const buildDescription = () => {
    if (searchQuery) {
      return `Найдено ${totalCount} магазинов автозапчастей по запросу "${searchQuery}". Проверенные продавцы в ОАЭ, качественные запчасти, быстрая доставка.`;
    }
    return `Каталог из ${totalCount} проверенных магазинов автозапчастей в ОАЭ. Найдите надежных поставщиков, сравните цены, читайте отзывы покупателей.`;
  };

  // Построение ключевых слов
  const buildKeywords = () => {
    let keywords = 'магазины автозапчастей, ОАЭ, Дубай, каталог магазинов, проверенные продавцы, автозапчасти оптом';
    
    if (searchQuery) {
      keywords += `, поиск ${searchQuery}`;
    }
    
    return keywords;
  };

  // JSON-LD structured data для списка магазинов
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": searchQuery ? `Результаты поиска "${searchQuery}"` : "Магазины автозапчастей",
    "description": buildDescription(),
    "numberOfItems": totalCount,
    "url": window.location.href,
    "mainEntity": {
      "@type": "CollectionPage",
      "name": "Каталог магазинов автозапчастей",
      "description": "Проверенные магазины и поставщики автозапчастей в ОАЭ",
      "provider": {
        "@type": "Organization",
        "@id": "https://partsbay.ae/#organization"
      }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Главная",
          "item": "https://partsbay.ae/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Магазины",
          "item": "https://partsbay.ae/stores"
        }
      ]
    }
  };

  const canonicalUrl = searchQuery 
    ? `${window.location.origin}/stores?search=${encodeURIComponent(searchQuery)}`
    : `${window.location.origin}/stores`;

  return (
    <SEOHead
      title={buildTitle()}
      description={buildDescription()}
      keywords={buildKeywords()}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
    />
  );
};

export default StoresSEO;
