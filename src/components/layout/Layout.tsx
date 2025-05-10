
import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import TopMenu from "./TopMenu";
import { useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";

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
  
  // Make sure imageUrl is an absolute URL
  const absoluteImageUrl = imageUrl.startsWith('http') 
    ? imageUrl 
    : `https://partsbay.ae${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
  
  // Current page URL
  const currentUrl = `https://partsbay.ae${location.pathname}`;
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content={absoluteImageUrl} />
        <meta property="og:site_name" content="partsbay.ae" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={absoluteImageUrl} />
        <meta property="twitter:domain" content="partsbay.ae" />
        <meta property="twitter:url" content={currentUrl} />
        
        {/* Telegram */}
        <meta property="telegram:title" content={title} />
        <meta property="telegram:description" content={description} />
        <meta property="telegram:image" content={absoluteImageUrl} />
      </Helmet>
      
      <Header />
      <TopMenu />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
