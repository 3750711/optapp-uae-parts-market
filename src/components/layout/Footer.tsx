
import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-optapp-dark text-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">OPTAPP</h3>
            <p className="text-gray-300">
              Маркетплейс автозапчастей из ОАЭ.
              Продажа качественных запчастей напрямую от поставщиков.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-optapp-yellow">
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-gray-300 hover:text-optapp-yellow">
                  Каталог
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-optapp-yellow">
                  О Нас
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-optapp-yellow">
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xl font-bold mb-4">Контакты</h3>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-optapp-yellow" />
                <span>+971 58 123 4567</span>
              </li>
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-optapp-yellow" />
                <span>info@optapp.ae</span>
              </li>
              <li className="flex items-start">
                <MapPin className="h-5 w-5 mr-2 text-optapp-yellow" />
                <span>Дубай, ОАЭ</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} OPTAPP. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
