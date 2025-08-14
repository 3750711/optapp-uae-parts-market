
import React from "react";
import SEOHead from "@/components/seo/SEOHead";

const TermsPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Terms and Conditions",
    "description": "Terms and Conditions for using PartsBay.ae auto parts marketplace",
    "url": "https://partsbay.ae/terms",
    "mainEntity": {
      "@type": "TermsOfService",
      "name": "PartsBay Terms of Service",
      "provider": {
        "@type": "Organization",
        "@id": "https://partsbay.ae/#organization"
      }
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://partsbay.ae/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Terms and Conditions",
          "item": "https://partsbay.ae/terms"
        }
      ]
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <SEOHead
        title="Terms and Conditions | PartsBay.ae - Auto Parts Marketplace UAE"
        description="Terms and Conditions for using PartsBay.ae - the leading auto parts marketplace in UAE. Read our user agreement, service terms, and policies."
        keywords="terms and conditions, user agreement, PartsBay, auto parts marketplace, UAE, service terms, legal policy"
        canonicalUrl="https://partsbay.ae/terms"
        structuredData={structuredData}
      />
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
