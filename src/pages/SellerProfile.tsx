
import React from "react";
import Layout from "@/components/layout/Layout";
import SellerDashboard from "@/components/seller/SellerDashboard";

const SellerProfile = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <SellerDashboard />
      </div>
    </Layout>
  );
};

export default SellerProfile;
