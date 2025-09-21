import React, { useEffect } from "react";
import Header from "./Header";

interface SellerLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const SellerLayout: React.FC<SellerLayoutProps> = ({ children, className }) => {
  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Replace current history entry to prevent going back via browser
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className={className || "flex-1"}>{children}</main>
    </div>
  );
};

export default SellerLayout;