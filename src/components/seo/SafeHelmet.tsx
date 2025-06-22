
import React from 'react';
import { Helmet } from 'react-helmet-async';

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
    return (
      <Helmet>
        {title && <title>{title}</title>}
        {description && <meta name="description" content={description} />}
        {keywords && <meta name="keywords" content={keywords} />}
        {children}
      </Helmet>
    );
  } catch (error) {
    console.warn('SafeHelmet error:', error);
    // Возвращаем null в случае ошибки, чтобы не блокировать рендеринг
    return null;
  }
};
