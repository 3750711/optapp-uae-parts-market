import SEOHead from '@/components/seo/SEOHead';

interface RequestsSEOProps {
  totalCount: number;
  searchQuery?: string;
}

const RequestsSEO: React.FC<RequestsSEOProps> = ({
  totalCount,
  searchQuery
}) => {
  // Построение динамического title
  const buildTitle = () => {
    if (searchQuery) {
      return `Поиск "${searchQuery}" - ${totalCount} запросов на запчасти | PartsBay.ae`;
    }
    return `Запросы на автозапчасти - ${totalCount} активных запросов | PartsBay.ae`;
  };

  // Построение динамического описания
  const buildDescription = () => {
    if (searchQuery) {
      return `Найдено ${totalCount} запросов на автозапчасти по запросу "${searchQuery}". Разместите свой запрос и получите предложения от 100+ проверенных поставщиков из ОАЭ.`;
    }
    return `${totalCount} активных запросов на автозапчасти от покупателей. Разместите запрос на поиск нужной запчасти и получите предложения от более 100 проверенных поставщиков из ОАЭ и Дубая.`;
  };

  // Построение ключевых слов
  const buildKeywords = () => {
    let keywords = 'запросы автозапчасти, поиск запчастей, заказать запчасти, ОАЭ, Дубай, автозапчасти оптом, B2B маркетплейс';
    
    if (searchQuery) {
      keywords += `, поиск ${searchQuery}`;
    }
    
    return keywords;
  };

  // JSON-LD structured data для списка запросов
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": searchQuery ? `Результаты поиска "${searchQuery}"` : "Запросы на автозапчасти",
    "description": buildDescription(),
    "numberOfItems": totalCount,
    "url": window.location.href,
    "mainEntity": {
      "@type": "ItemList",
      "name": "Запросы покупателей на автозапчасти",
      "description": "Актуальные запросы покупателей на поиск автозапчастей",
      "numberOfItems": totalCount
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
          "name": "Запросы",
          "item": "https://partsbay.ae/requests"
        }
      ]
    },
    "provider": {
      "@type": "Organization",
      "@id": "https://partsbay.ae/#organization"
    }
  };

  const canonicalUrl = searchQuery 
    ? `${window.location.origin}/requests?search=${encodeURIComponent(searchQuery)}`
    : `${window.location.origin}/requests`;

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

export default RequestsSEO;
