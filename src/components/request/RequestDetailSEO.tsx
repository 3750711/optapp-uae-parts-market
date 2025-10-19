import SEOHead from '@/components/seo/SEOHead';

interface RequestDetailSEOProps {
  request: {
    id: string;
    title: string;
    description?: string;
    brand?: string;
    model?: string;
    vin?: string;
    status: string;
    created_at: string;
    user_name?: string;
  };
}

const RequestDetailSEO: React.FC<RequestDetailSEOProps> = ({ request }) => {
  // Построение динамического title
  const buildTitle = () => {
    if (request.brand && request.model) {
      return `Запчасти ${request.brand} ${request.model} - ${request.title} | PartsBay.ae`;
    }
    if (request.brand) {
      return `Запчасти ${request.brand} - ${request.title} | PartsBay.ae`;
    }
    return `${request.title} - Запрос на автозапчасти | PartsBay.ae`;
  };

  // Построение динамического описания
  const buildDescription = () => {
    let desc = request.title;
    
    if (request.description) {
      const shortDesc = request.description.substring(0, 120);
      desc = `${shortDesc}${request.description.length > 120 ? '...' : ''}`;
    }
    
    if (request.brand || request.model) {
      const carInfo = [request.brand, request.model].filter(Boolean).join(' ');
      desc = `${carInfo}. ${desc}`;
    }
    
    const statusText = request.status === 'completed' ? 'Выполнен' : 'В работе';
    const dateText = new Date(request.created_at).toLocaleDateString('ru-RU');
    
    return `${desc} | Статус: ${statusText} | Дата: ${dateText}`;
  };

  // Построение ключевых слов
  const buildKeywords = () => {
    const keywords = ['запрос на автозапчасти', 'поиск запчастей', 'ОАЭ', 'Дубай'];
    
    if (request.brand) keywords.push(request.brand);
    if (request.model) keywords.push(request.model);
    if (request.title) keywords.push(request.title);
    
    return keywords.join(', ');
  };

  // JSON-LD structured data для детального запроса
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Question",
    "name": request.title,
    "text": request.description || request.title,
    "dateCreated": request.created_at,
    "url": window.location.href,
    "author": {
      "@type": "Person",
      "name": request.user_name || "Покупатель"
    },
    "about": {
      "@type": "Product",
      "name": request.title,
      "brand": request.brand ? {
        "@type": "Brand",
        "name": request.brand
      } : undefined,
      "model": request.model || undefined
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
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": request.title,
          "item": window.location.href
        }
      ]
    }
  };

  const canonicalUrl = `${window.location.origin}/requests/${request.id}`;

  // OG Image - используем дефолтное изображение или можно генерировать динамически
  const ogImage = `${window.location.origin}/placeholder.svg`;

  return (
    <SEOHead
      title={buildTitle()}
      description={buildDescription()}
      keywords={buildKeywords()}
      canonicalUrl={canonicalUrl}
      ogImage={ogImage}
      structuredData={structuredData}
    />
  );
};

export default RequestDetailSEO;
