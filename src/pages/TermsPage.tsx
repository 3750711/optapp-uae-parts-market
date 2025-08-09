
import React from "react";
import { Helmet } from "react-helmet-async";

const TermsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Terms and Conditions | PartsBay</title>
        <meta name="description" content="Terms and Conditions of PartsBay" />
      </Helmet>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Terms and Conditions</h1>
        <p className="text-muted-foreground">
          This page will contain our Terms and Conditions. Content to be added later.
        </p>
      </div>
    </div>
  );
};

export default TermsPage;
