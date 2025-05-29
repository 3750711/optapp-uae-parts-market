
import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = "PartsBay.ae - Оптовый рынок автозапчастей из ОАЭ",
  description = "B2B маркетплейс автозапчастей. Покупайте оптом у проверенных поставщиков из ОАЭ. Прямые поставки, конкурентные цены, качественный сервис.",
  keywords = "автозапчасти оптом, ОАЭ, Дубай, B2B маркетплейс, поставщики автозапчастей, оптовые продажи",
  ogImage = "/og-image.jpg",
  canonicalUrl,
  structuredData
}) => {
  useEffect(() => {
    console.log('SEOHead: Setting meta tags', { title, description, ogImage });
    
    // Устанавливаем title
    document.title = title;

    // Устанавливаем meta теги
    const setMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let meta = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
      console.log(`SEOHead: Set ${attribute}="${name}" content="${content}"`);
    };

    // Основные meta теги
    setMetaTag('description', description);
    setMetaTag('keywords', keywords);
    setMetaTag('robots', 'index, follow');
    setMetaTag('author', 'PartsBay.ae');
    
    // Получаем полный URL для изображения
    const fullImageUrl = ogImage.startsWith('http') 
      ? ogImage 
      : `${window.location.origin}${ogImage}`;
    
    console.log('SEOHead: Full image URL:', fullImageUrl);
    
    // Open Graph теги
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', fullImageUrl, true);
    setMetaTag('og:type', 'website', true);
    setMetaTag('og:site_name', 'PartsBay.ae', true);
    setMetaTag('og:url', canonicalUrl || window.location.href, true);
    
    // Twitter Card теги
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', fullImageUrl);
    setMetaTag('twitter:site', '@partsbayae');

    // Canonical URL
    if (canonicalUrl) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', canonicalUrl);
    }

    // Structured Data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // Cleanup function
    return () => {
      // Не удаляем meta теги при размонтировании, 
      // чтобы избежать мерцания при навигации
    };
  }, [title, description, keywords, ogImage, canonicalUrl, structuredData]);

  return null; // Этот компонент не рендерит ничего в DOM
};

export default SEOHead;
