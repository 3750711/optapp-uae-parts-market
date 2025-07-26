import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface SellerLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const SellerLayout: React.FC<SellerLayoutProps> = ({ children, className }) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Scroll to top when component mounts
    window.scrollTo(0, 0);
    
    // Replace current history entry to prevent going back via browser
    window.history.replaceState(null, "", window.location.pathname);
  }, []);

  const handleBackToDashboard = () => {
    navigate('/seller/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToDashboard}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
      <main className={className || "flex-1"}>{children}</main>
    </div>
  );
};

export default SellerLayout;