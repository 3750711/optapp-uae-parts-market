import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100 mt-auto">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-primary">OPT</span>
              <span className="text-secondary">APP</span>
            </h3>
            <p className="text-foreground/80 leading-relaxed">
              Маркетплейс автозапчастей из ОАЭ.<br />
              Продажа качественных запчастей напрямую от поставщиков.
            </p>
          </div>

          
          <div className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h3 className="text-xl font-bold mb-4 text-foreground">Навигация</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-foreground/80 hover:text-primary transition-colors">Главная</Link>
              </li>
              <li>
                <Link to="/catalog" className="text-foreground/80 hover:text-primary transition-colors">Каталог</Link>
              </li>
              <li>
                <Link to="/about" className="text-foreground/80 hover:text-primary transition-colors">О нас</Link>
              </li>
              <li>
                <Link to="/contact" className="text-foreground/80 hover:text-primary transition-colors">Контакты</Link>
              </li>
            </ul>
          </div>

          {/* Убраны контакты из футера */}
        </div>

        <div className="mt-12 pt-6 border-t border-gray-100 text-center text-foreground/70">
          <p>&copy; {new Date().getFullYear()} <span className="text-primary font-medium">OPTAPP</span>. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
