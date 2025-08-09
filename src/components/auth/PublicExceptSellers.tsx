import React, { memo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface PublicExceptSellersProps {
  children: React.ReactNode;
}

const PublicExceptSellers: React.FC<PublicExceptSellersProps> = ({ children }) => {
  const { profile, isLoading } = useAuth();

  // Render publicly while auth is loading to keep page indexable
  if (isLoading) return <>{children}</>;

  // Block sellers
  if (profile?.user_type === "seller") {
    return <Navigate to="/seller/dashboard" replace />;
  }

  return <>{children}</>;
};

export default memo(PublicExceptSellers);

