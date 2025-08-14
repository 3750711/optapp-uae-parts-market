
import React from "react";
import SEOHead from "@/components/seo/SEOHead";

const PrivacyPage: React.FC = () => {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy",
    "description": "Privacy Policy for PartsBay.ae auto parts marketplace - how we collect, use and protect your data",
    "url": "https://partsbay.ae/privacy",
    "mainEntity": {
      "@type": "PrivacyPolicy",
      "name": "PartsBay Privacy Policy",
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
          "name": "Privacy Policy",
          "item": "https://partsbay.ae/privacy"
        }
      ]
    }
  };

  return (
    <div className="container mx-auto px-4 py-10">
      <SEOHead
        title="Privacy Policy | PartsBay.ae - Auto Parts Marketplace UAE"
        description="Privacy Policy for PartsBay.ae - Learn how we collect, use, and protect your personal data on our auto parts marketplace in UAE."
        keywords="privacy policy, data protection, personal information, PartsBay, auto parts marketplace, UAE, privacy rights, GDPR"
        canonicalUrl="https://partsbay.ae/privacy"
        structuredData={structuredData}
      />
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
