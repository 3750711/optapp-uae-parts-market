
import React from 'react';

interface AdminProductsHeaderProps {
  title?: string;
}

const AdminProductsHeader: React.FC<AdminProductsHeaderProps> = ({ 
  title = "Управление товарами" 
}) => {
  return (
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
};

export default AdminProductsHeader;
