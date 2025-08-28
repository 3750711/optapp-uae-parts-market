
import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { PWAStatus } from '@/components/PWAStatus';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  language?: 'ru' | 'en' | 'bn';
}

const Layout: React.FC<LayoutProps> = ({ children, className, language = 'ru' }) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Set HTML lang attribute for accessibility and SEO
    document.documentElement.lang = language;
  }, [language]);

  return (
    <div className="flex flex-col safe-height bg-background text-foreground">
      <Header />
      <main className={className || ""}>{children}</main>
      <Footer language={language} />
      <PWAStatus />
    </div>
  );
};

export default Layout;
