
import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-primary">PARTS</span>
              <span className="text-secondary">BAY</span>
            </h3>
            <p className="text-foreground/80 leading-relaxed">
              Торговая площадка автозапчастей в ОАЭ напрямую от поставщиков и магазинов.
            </p>
            <p className="text-foreground/70 text-sm mt-4 italic">
              Информация на портале PartsBay носит исключительно ознакомительный характер, все продавцы являются самостоятельными компаниями или физическими лицами, за действия которых наш портал ответственности не несет.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 text-center text-foreground/70">
          <p>&copy; {new Date().getFullYear()} <span className="text-primary font-medium">PartsBay</span>. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
