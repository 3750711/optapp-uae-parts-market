
import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";


interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  language?: 'ru' | 'en' | 'bn';
}

const Layout: React.FC<LayoutProps> = ({ children, className, language = 'en' }) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Set HTML lang attribute for accessibility and SEO
    document.documentElement.lang = language;
    
    // Enable safe-area debug in development
    if (process.env.NODE_ENV === 'development') {
      import('@/utils/pwaDetection').then(({ enableSafeAreaDebug }) => {
        enableSafeAreaDebug();
      });
    }
  }, [language]);

  return (
    <div className="flex flex-col safe-viewport bg-background text-foreground overflow-hidden">
      <Header />
      <main className={`${className || ""} safe-area-container no-bounce`}>{children}</main>
      <Footer language={language} />
      
    </div>
  );
};

export default Layout;
