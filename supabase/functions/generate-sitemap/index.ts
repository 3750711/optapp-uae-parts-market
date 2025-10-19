import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml; charset=UTF-8",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const baseUrl = "https://partsbay.ae";
    const now = new Date().toISOString().split("T")[0];

    // Static pages
    const staticPages = [
      { path: "/", priority: 1.0, changefreq: "daily" },
      { path: "/catalog", priority: 0.9, changefreq: "hourly" },
      { path: "/stores", priority: 0.8, changefreq: "daily" },
      { path: "/buyer-guide", priority: 0.7, changefreq: "weekly" },
      { path: "/requests", priority: 0.6, changefreq: "daily" },
      { path: "/about", priority: 0.5, changefreq: "monthly" },
      { path: "/contact", priority: 0.5, changefreq: "monthly" },
      { path: "/terms", priority: 0.3, changefreq: "yearly" },
      { path: "/privacy", priority: 0.3, changefreq: "yearly" },
    ];

    // Fetch active products
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at")
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(5000);

    // Fetch stores
    const { data: stores } = await supabase
      .from("stores")
      .select("id, updated_at")
      .order("updated_at", { ascending: false })
      .limit(1000);

    // Fetch public requests
    const { data: requests } = await supabase
      .from("requests")
      .select("id, updated_at")
      .eq("status", "open")
      .order("updated_at", { ascending: false })
      .limit(1000);

    // Build XML
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach((page) => {
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}${page.path}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
      xml += `    <priority>${page.priority}</priority>\n`;
      xml += "  </url>\n";
    });

    // Add products
    products?.forEach((product) => {
      const lastmod = product.updated_at
        ? new Date(product.updated_at).toISOString().split("T")[0]
        : now;
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/product/${product.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += "  </url>\n";
    });

    // Add stores
    stores?.forEach((store) => {
      const lastmod = store.updated_at
        ? new Date(store.updated_at).toISOString().split("T")[0]
        : now;
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/store/${store.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.7</priority>\n`;
      xml += "  </url>\n";
    });

    // Add requests
    requests?.forEach((request) => {
      const lastmod = request.updated_at
        ? new Date(request.updated_at).toISOString().split("T")[0]
        : now;
      xml += "  <url>\n";
      xml += `    <loc>${baseUrl}/request/${request.id}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += "  </url>\n";
    });

    xml += "</urlset>";

    console.log(`Sitemap generated: ${products?.length || 0} products, ${stores?.length || 0} stores, ${requests?.length || 0} requests`);

    return new Response(xml, {
      headers: corsHeaders,
      status: 200,
    });
  } catch (error) {
    console.error("Error generating sitemap:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
