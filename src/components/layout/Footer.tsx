
import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-accentBlue">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4 text-accentBlue">OPTAPP</h3>
            <p className="text-[#181920]">
              Маркетплейс автозапчастей из ОАЭ.<br />
              Продажа качественных запчастей напрямую от поставщиков.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-accentBlue">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-[#181920] hover:text-accentBlue font-medium transition-colors">Главная</Link>
              </li>
              <li>
                <Link to="/catalog" className="text-[#181920] hover:text-accentBlue font-medium transition-colors">Каталог</Link>
              </li>
              <li>
                <Link to="/about" className="text-[#181920] hover:text-accentBlue font-medium transition-colors">О нас</Link>
              </li>
              <li>
                <Link to="/contact" className="text-[#181920] hover:text-accentBlue font-medium transition-colors">Контакты</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4 text-accentBlue">Контакты</h3>
            <ul className="space-y-3 text-[#181920]">
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-accentBlue" />
                <span>+971 58 123 4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-accentBlue" />
                <span>info@optapp.ae</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-accentBlue" />
                <span>Дубай, ОАЭ</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-accentBlue text-center text-[#181920]">
          <p>&copy; {new Date().getFullYear()} <span className="text-accentBlue">OPTAPP</span>. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
