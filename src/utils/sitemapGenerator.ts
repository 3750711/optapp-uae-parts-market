
export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export class SitemapGenerator {
  private urls: SitemapUrl[] = [];

  addUrl(url: SitemapUrl) {
    this.urls.push(url);
  }

  addStaticPages() {
    const baseUrl = window.location.origin;
    const staticPages = [
      { path: '/', priority: 1.0, changefreq: 'daily' as const },
      { path: '/catalog', priority: 0.9, changefreq: 'hourly' as const },
      { path: '/about', priority: 0.5, changefreq: 'monthly' as const },
      { path: '/contact', priority: 0.5, changefreq: 'monthly' as const },
      { path: '/buyer-guide', priority: 0.7, changefreq: 'weekly' as const },
      { path: '/stores', priority: 0.8, changefreq: 'daily' as const },
    ];

    staticPages.forEach(page => {
      this.addUrl({
        loc: `${baseUrl}${page.path}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: page.changefreq,
        priority: page.priority
      });
    });
  }

  addProducts(products: Array<{ id: string; updated_at?: string }>) {
    const baseUrl = window.location.origin;
    
    products.forEach(product => {
      this.addUrl({
        loc: `${baseUrl}/product/${product.id}`,
        lastmod: product.updated_at ? new Date(product.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.8
      });
    });
  }

  addStores(stores: Array<{ id: string; updated_at?: string }>) {
    const baseUrl = window.location.origin;
    
    stores.forEach(store => {
      this.addUrl({
        loc: `${baseUrl}/store/${store.id}`,
        lastmod: store.updated_at ? new Date(store.updated_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        changefreq: 'weekly',
        priority: 0.7
      });
    });
  }

  generateXML(): string {
    const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>';
    const urlsetOpen = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    const urlsetClose = '</urlset>';

    const urlsXML = this.urls.map(url => {
      let urlXML = `  <url>\n    <loc>${url.loc}</loc>`;
      
      if (url.lastmod) {
        urlXML += `\n    <lastmod>${url.lastmod}</lastmod>`;
      }
      
      if (url.changefreq) {
        urlXML += `\n    <changefreq>${url.changefreq}</changefreq>`;
      }
      
      if (url.priority !== undefined) {
        urlXML += `\n    <priority>${url.priority}</priority>`;
      }
      
      urlXML += '\n  </url>';
      return urlXML;
    }).join('\n');

    return `${xmlHeader}\n${urlsetOpen}\n${urlsXML}\n${urlsetClose}`;
  }

  downloadSitemap() {
    const xmlContent = this.generateXML();
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  }
}

// Hook for generating sitemap
export const useSitemapGenerator = () => {
  const generateSitemap = async () => {
    const generator = new SitemapGenerator();
    
    // Add static pages
    generator.addStaticPages();
    
    // TODO: Fetch and add dynamic content
    // This would require API calls to get products and stores
    // For now, we'll generate with static pages only
    
    return generator;
  };

  return { generateSitemap };
};
