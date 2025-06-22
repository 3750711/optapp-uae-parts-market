
import React from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';

interface SafeHelmetProps {
  title?: string;
  description?: string;
  keywords?: string;
  children?: React.ReactNode;
}

export const SafeHelmet: React.FC<SafeHelmetProps> = ({ 
  title, 
  description, 
  keywords, 
  children 
}) => {
  try {
    // Проверяем, есть ли HelmetProvider в контексте
    const HelmetContent = () => (
      <Helmet>
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
        {children}
      </Helmet>
    );

    return <HelmetContent />;
  } catch (error) {
    console.warn('SafeHelmet error:', error);
    
    // Fallback: устанавливаем meta теги напрямую через DOM API
    React.useEffect(() => {
      if (title) {
        document.title = title;
      }
      
      if (description) {
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'description');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', description);
      }
      
      if (keywords) {
        let meta = document.querySelector('meta[name="keywords"]');
        if (!meta) {
          meta = document.createElement('meta');
          meta.setAttribute('name', 'keywords');
          document.head.appendChild(meta);
        }
        meta.setAttribute('content', keywords);
      }
    }, [title, description, keywords]);
    
    // Возвращаем null при ошибке, чтобы не блокировать рендеринг
    return null;
  }
};
