
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface AdminSEOProps {
  title: string;
  description?: string;
  breadcrumbs?: Array<{ name: string; href?: string }>;
}

export const AdminSEO: React.FC<AdminSEOProps> = ({ 
  title, 
  description = "Административная панель управления заказами OptCargo",
  breadcrumbs = []
}) => {
  const fullTitle = `${title} | OptCargo Admin`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="noindex, nofollow" />
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title,
          "description": description,
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": breadcrumbs.map((crumb, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "name": crumb.name,
              "item": crumb.href ? `${window.location.origin}${crumb.href}` : undefined
            }))
          }
        })}
      </script>
    </Helmet>
  );
};
