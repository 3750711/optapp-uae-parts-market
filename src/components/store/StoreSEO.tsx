
import SEOHead from '@/components/seo/SEOHead';
import { StoreWithImages } from '@/types/store';

interface StoreSEOProps {
  store: StoreWithImages;
  reviewsCount?: number;
  averageRating?: number;
}

const StoreSEO: React.FC<StoreSEOProps> = ({
  store,
  reviewsCount = 0,
  averageRating
}) => {
  // Построение динамического title
  const buildTitle = () => {
    const rating = averageRating ? ` (${averageRating.toFixed(1)}★)` : '';
    return `${store.name}${rating} - Магазин автозапчастей | PartsBay.ae`;
  };

  // Построение динамического описания
  const buildDescription = () => {
    let description = `${store.name} - `;
    
    if (store.description) {
      description += store.description.slice(0, 120) + '...';
    } else {
      description += 'магазин автозапчастей в ОАЭ. Качественные запчасти от проверенного продавца.';
    }
    
    if (reviewsCount > 0) {
      description += ` Отзывы: ${reviewsCount}.`;
    }
    
    if (averageRating) {
      description += ` Рейтинг: ${averageRating.toFixed(1)}/5.`;
    }
    
    return description;
  };

  // Построение ключевых слов
  const buildKeywords = () => {
    let keywords = `${store.name}, автозапчасти, магазин автозапчастей, ОАЭ, Дубай`;
    
    if (store.tags && store.tags.length > 0) {
      keywords += ', ' + store.tags.join(', ');
    }
    
    return keywords;
  };

  // JSON-LD structured data для магазина
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    "name": store.name,
    "description": store.description || `Магазин автозапчастей ${store.name}`,
    "url": window.location.href,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": store.address,
      "addressLocality": store.location || "ОАЭ",
      "addressCountry": "AE"
    },
    "telephone": store.phone,
    "image": store.store_images?.[0]?.url,
    "priceRange": "$$",
    ...(averageRating && {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": averageRating,
        "reviewCount": reviewsCount,
        "bestRating": 5,
        "worstRating": 1
      }
    }),
    "openingHours": "Mo-Su 09:00-18:00",
    "currenciesAccepted": "AED, USD",
    "paymentAccepted": "Cash, Credit Card, Bank Transfer"
  };

  const canonicalUrl = `${window.location.origin}/stores/${store.id}`;
  const ogImage = store.store_images?.[0]?.url || '/og-image.jpg';

  return (
    <SEOHead
      title={buildTitle()}
      description={buildDescription()}
      keywords={buildKeywords()}
      ogImage={ogImage}
      canonicalUrl={canonicalUrl}
      structuredData={structuredData}
    />
  );
};

export default StoreSEO;
