import { SitemapGenerator } from './sitemapGenerator';

// Production sitemap configuration
export const PRODUCTION_DOMAIN = 'https://partsbay.ae';

// Generate and save sitemap for production
export const generateProductionSitemap = async () => {
  try {
    const generator = new SitemapGenerator();
    
    // Add static pages
    generator.addStaticPages();
    
    // TODO: In production, fetch real data from Supabase
    // For now, we'll use the static sitemap.xml that's already created
    
    return generator.generateXML();
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return null;
  }
};

// Update sitemap when new content is added
export const updateSitemapOnContentChange = async (type: 'product' | 'store', id: string) => {
  // This would be called when new products/stores are added
  // In a real production app, this would trigger a sitemap regeneration
  console.log(`Sitemap update needed for ${type}: ${id}`);
};

// SEO meta helpers
export const generateMetaRobots = (noIndex = false, noFollow = false): string => {
  const directives = [];
  
  if (noIndex) directives.push('noindex');
  else directives.push('index');
  
  if (noFollow) directives.push('nofollow');
  else directives.push('follow');
  
  return directives.join(', ');
};

// Canonical URL helper
export const generateCanonicalUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${PRODUCTION_DOMAIN}${cleanPath}`;
};

// Hreflang helper for multilingual support
export const generateHrefLangTags = (currentPath: string) => {
  const languages = [
    { code: 'en', region: 'AE', label: 'English (UAE)' },
    { code: 'ar', region: 'AE', label: 'Arabic (UAE)' },
    { code: 'ru', region: 'AE', label: 'Russian (UAE)' }
  ];
  
  return languages.map(lang => ({
    hreflang: `${lang.code}-${lang.region}`,
    href: `${PRODUCTION_DOMAIN}/${lang.code}${currentPath}`
  }));
};