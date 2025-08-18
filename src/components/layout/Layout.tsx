
import React, { useEffect } from "react";
import Header from "./Header";
import Footer from "./Footer";
import { PWAStatus } from '@/components/PWAStatus';
import { PWAUpdateBanner } from '@/components/PWAUpdateBanner';

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  language?: 'ru' | 'en';
}

const Layout: React.FC<LayoutProps> = ({ children, className, language }) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <PWAUpdateBanner />
      <Header />
      <main className={className || ""}>{children}</main>
      <Footer language={language} />
      <PWAStatus />
    </div>
  );
};

export default Layout;
