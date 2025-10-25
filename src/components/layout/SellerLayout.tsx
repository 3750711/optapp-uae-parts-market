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
  }, []);

  return (
    <div className="flex flex-col safe-viewport bg-background text-foreground overflow-hidden">
      <Header />
      <main className={`${className || "flex-1"} safe-area-container no-bounce`}>{children}</main>
    </div>
  );
};

export default SellerLayout;