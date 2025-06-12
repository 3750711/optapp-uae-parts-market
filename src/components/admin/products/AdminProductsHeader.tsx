
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AdminProductsHeaderProps {
  title?: string;
}

const AdminProductsHeader: React.FC<AdminProductsHeaderProps> = ({ 
  title = "Управление товарами" 
}) => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="flex items-center gap-4">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleGoBack}
        className="flex items-center gap-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Назад
      </Button>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
};

export default AdminProductsHeader;
