
import React from "react";
import { Helmet } from "react-helmet-async";

const PrivacyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-10">
      <Helmet>
        <title>Privacy Policy | PartsBay</title>
        <meta name="description" content="Privacy Policy of PartsBay" />
      </Helmet>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-semibold">Privacy Policy</h1>
        <p className="text-muted-foreground">
          This page will contain our Privacy Policy. Content to be added later.
        </p>
      </div>
    </div>
  );
};

export default PrivacyPage;
