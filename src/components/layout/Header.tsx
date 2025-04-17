
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import { Button } from "@/components/ui/button";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-optapp-yellow shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <ShoppingBag className="h-8 w-8 text-optapp-dark" />
            <span className="ml-2 text-2xl font-bold text-optapp-dark">OPTAPP</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/catalog" className="text-optapp-dark font-medium hover:underline">
              Каталог
            </Link>
            <Link to="/about" className="text-optapp-dark font-medium hover:underline">
              О Нас
            </Link>
            <Link to="/contact" className="text-optapp-dark font-medium hover:underline">
              Контакты
            </Link>
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline" className="border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white">
                Вход
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-optapp-dark text-white hover:bg-opacity-80">
                Регистрация
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? (
              <X className="h-6 w-6 text-optapp-dark" />
            ) : (
              <Menu className="h-6 w-6 text-optapp-dark" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4">
            <div className="flex flex-col space-y-3">
              <Link 
                to="/catalog" 
                className="text-optapp-dark font-medium py-2 hover:bg-yellow-100 px-2 rounded"
                onClick={toggleMenu}
              >
                Каталог
              </Link>
              <Link 
                to="/about" 
                className="text-optapp-dark font-medium py-2 hover:bg-yellow-100 px-2 rounded"
                onClick={toggleMenu}
              >
                О Нас
              </Link>
              <Link 
                to="/contact" 
                className="text-optapp-dark font-medium py-2 hover:bg-yellow-100 px-2 rounded"
                onClick={toggleMenu}
              >
                Контакты
              </Link>
              <div className="flex space-x-2 pt-2">
                <Link to="/login" className="flex-1" onClick={toggleMenu}>
                  <Button variant="outline" className="w-full border-optapp-dark text-optapp-dark hover:bg-optapp-dark hover:text-white">
                    Вход
                  </Button>
                </Link>
                <Link to="/register" className="flex-1" onClick={toggleMenu}>
                  <Button className="w-full bg-optapp-dark text-white hover:bg-opacity-80">
                    Регистрация
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
