
import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  imageUrl?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = "partsbay.ae - Оптовый рынок автозапчастей в ОАЭ",
  description = "partsbay.ae - платформа для оптовой торговли автозапчастями в ОАЭ",
  imageUrl = "https://partsbay.ae/og-image.png"
}) => {
  const location = useLocation();
  
  useEffect(() => {
    // Update metadata dynamically based on props
    document.title = title;
    
    // Update meta tags
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", description);
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    
    if (ogTitle) ogTitle.setAttribute("content", title);
    if (ogDescription) ogDescription.setAttribute("content", description);
    if (ogUrl) ogUrl.setAttribute("content", `https://partsbay.ae${location.pathname}`);
    if (ogImage) ogImage.setAttribute("content", imageUrl);
    
    // Update Twitter card tags
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    const twitterUrl = document.querySelector('meta[name="twitter:url"]');
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    
    if (twitterTitle) twitterTitle.setAttribute("content", title);
    if (twitterDescription) twitterDescription.setAttribute("content", description);
    if (twitterUrl) twitterUrl.setAttribute("content", `https://partsbay.ae${location.pathname}`);
    if (twitterImage) twitterImage.setAttribute("content", imageUrl);
    
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, [title, description, imageUrl, location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
