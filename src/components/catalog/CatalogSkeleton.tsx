
import React from "react";
import ProductSkeleton from "@/components/catalog/ProductSkeleton";

const CatalogSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <ProductSkeleton key={index} />
      ))}
    </div>
  );
};

export default CatalogSkeleton;
