
import React from "react";
import { Link } from "react-router-dom";

interface FooterProps {
  language?: 'ru' | 'en';
}

const getFooterTranslations = (language: 'ru' | 'en') => {
  const translations = {
    ru: {
      description: "Торговая площадка автозапчастей в ОАЭ напрямую от поставщиков и магазинов.",
      disclaimer: "Информация на портале PartsBay носит исключительно ознакомительный характер, все продавцы являются самостоятельными компаниями или физическими лицами, за действия которых наш портал ответственности не несет.",
      copyright: "Все права защищены."
    },
    en: {
      description: "Auto parts marketplace in the UAE directly from suppliers and stores.",
      disclaimer: "Information on the PartsBay portal is for informational purposes only. All sellers are independent companies or individuals, and our portal bears no responsibility for their actions.",
      copyright: "All rights reserved."
    }
  };
  return translations[language];
};

const Footer: React.FC<FooterProps> = ({ language = 'ru' }) => {
  const t = getFooterTranslations(language);
  
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
              {t.description}
            </p>
            <p className="text-foreground/70 text-sm mt-4 italic">
              {t.disclaimer}
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 text-center text-foreground/70">
          <p>&copy; {new Date().getFullYear()} <span className="text-primary font-medium">PartsBay</span>. {t.copyright}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
