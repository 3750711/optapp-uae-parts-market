
import React from "react";
import Layout from "@/components/layout/Layout";
import SellerListingsContent from "@/components/seller/SellerListingsContent";

const SellerListings = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <SellerListingsContent />
      </div>
    </Layout>
  );
};

export default SellerListings;
