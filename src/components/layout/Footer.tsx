
import React from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#f3f414] mt-auto border-t border-black">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="transition-all duration-300 hover:translate-y-[-5px]">
            <h3 className="text-xl font-bold mb-4" style={{ color: "#000" }}>OPTAPP</h3>
            <p className="text-black">
              Маркетплейс автозапчастей из ОАЭ.<br />
              Продажа качественных запчастей напрямую от поставщиков.
            </p>
          </div>

          <div className="transition-all duration-300 hover:translate-y-[-5px]">
            <h3 className="text-xl font-bold mb-4" style={{ color: "#000" }}>Навигация</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-black hover:text-gray-800 font-medium transition-all duration-300 hover:translate-x-1 inline-block">Главная</Link>
              </li>
              <li>
                <Link to="/catalog" className="text-black hover:text-gray-800 font-medium transition-all duration-300 hover:translate-x-1 inline-block">Каталог</Link>
              </li>
              <li>
                <Link to="/about" className="text-black hover:text-gray-800 font-medium transition-all duration-300 hover:translate-x-1 inline-block">О нас</Link>
              </li>
              <li>
                <Link to="/contact" className="text-black hover:text-gray-800 font-medium transition-all duration-300 hover:translate-x-1 inline-block">Контакты</Link>
              </li>
            </ul>
          </div>

          <div className="transition-all duration-300 hover:translate-y-[-5px]">
            <h3 className="text-xl font-bold mb-4" style={{ color: "#000" }}>Контакты</h3>
            <ul className="space-y-3 text-black">
              <li className="flex items-center group">
                <Phone className="h-5 w-5 mr-2 text-black group-hover:scale-110 transition-transform duration-300" />
                <span className="group-hover:font-medium transition-all duration-300">+971 58 123 4567</span>
              </li>
              <li className="flex items-center group">
                <Mail className="h-5 w-5 mr-2 text-black group-hover:scale-110 transition-transform duration-300" />
                <span className="group-hover:font-medium transition-all duration-300">info@optapp.ae</span>
              </li>
              <li className="flex items-start group">
                <MapPin className="h-5 w-5 mr-2 text-black group-hover:scale-110 transition-transform duration-300" />
                <span className="group-hover:font-medium transition-all duration-300">Дубай, ОАЭ</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-black text-center text-black">
          <p>&copy; {new Date().getFullYear()} OPTAPP. Все права защищены.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
