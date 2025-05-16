
import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-primary">partsbay</span>
              <span className="text-secondary">.ae</span>
            </h3>
            <p className="text-foreground/80 leading-relaxed">
              {t('footer.marketplace')}
            </p>
            <p className="text-foreground/70 text-sm mt-4 italic">
              {t('footer.disclaimer')}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 text-center text-foreground/70">
          <p>&copy; {currentYear} <span className="text-primary font-medium">PartsBay</span>. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
